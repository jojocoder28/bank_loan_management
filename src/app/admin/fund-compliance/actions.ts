
"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import Loan from "@/models/loan";
import FundTopUp from "@/models/fundTopUp";
import { computeCompliance, ComplianceResult } from "@/lib/fund-compliance";
import { logAuditActivity } from "@/lib/audit";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface ComplianceRow {
    userId: string;
    name: string;
    membershipNumber: string;
    shareFund: number;
    guaranteedFund: number;
    totalActiveLoanPrincipal: number;
    compliance: ComplianceResult;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getFundComplianceData(): Promise<ComplianceRow[]> {
    await dbConnect();

    const members = await User.find({
        role: { $in: ['member', 'board_member'] },
        status: 'active',
    }).lean();

    const memberIds = members.map(m => m._id);

    const activeLoans = await Loan.find({
        user: { $in: memberIds },
        status: 'active',
    }).lean();

    // Build a map: userId → total active loan principal
    const principalMap = new Map<string, number>();
    for (const loan of activeLoans) {
        const uid = loan.user.toString();
        principalMap.set(uid, (principalMap.get(uid) ?? 0) + loan.principal);
    }

    const rows: ComplianceRow[] = members.map(member => {
        const uid = member._id.toString();
        const totalActiveLoanPrincipal = principalMap.get(uid) ?? 0;
        const compliance = computeCompliance(
            member.shareFund ?? 0,
            member.guaranteedFund ?? 0,
            totalActiveLoanPrincipal,
        );
        return {
            userId: uid,
            name: member.name,
            membershipNumber: member.membershipNumber ?? 'N/A',
            shareFund: member.shareFund ?? 0,
            guaranteedFund: member.guaranteedFund ?? 0,
            totalActiveLoanPrincipal,
            compliance,
        };
    });

    // Sort: non-compliant first, then by shortfall descending
    return rows.sort((a, b) => {
        if (!a.compliance.isCompliant && b.compliance.isCompliant) return -1;
        if (a.compliance.isCompliant && !b.compliance.isCompliant) return 1;
        return b.compliance.shortfall - a.compliance.shortfall;
    });
}

// ─── Single Top-Up ────────────────────────────────────────────────────────────

export async function topUpUserFunds(
    userId: string,
    sfAmount: number,
    gfAmount: number,
    note?: string,
): Promise<{ success?: string; error?: string }> {
    try {
        await dbConnect();
        const session = await getSession();
        const adminEmail = session?.user?.email ?? 'admin';

        const member = await User.findById(userId);
        if (!member) return { error: 'Member not found.' };

        const now = new Date();
        const totalAmount = sfAmount + gfAmount;
        if (totalAmount <= 0) return { error: 'Top-up amount must be greater than zero.' };

        // Apply to user balances
        await User.updateOne(
            { _id: userId },
            {
                $inc: {
                    shareFund: sfAmount,
                    guaranteedFund: gfAmount,
                },
            },
        );

        // Record for statement feed
        await FundTopUp.create({
            user: userId,
            sfAmount,
            gfAmount,
            totalAmount,
            type: sfAmount > 0 && gfAmount > 0 ? 'split' : sfAmount > 0 ? 'sf' : 'gf',
            note: note || 'Admin top-up for SF/GF compliance',
            addedBy: adminEmail,
            month: now.getMonth(),
            year: now.getFullYear(),
            includedInStatement: false,
        });

        // Audit trail
        await logAuditActivity({
            action: 'fund_topup',
            actor: adminEmail,
            targetUserId: userId,
            details: `SF/GF top-up: SF +₹${sfAmount}, GF +₹${gfAmount} (total ₹${totalAmount}). Note: ${note || 'compliance adjustment'}`,
        });

        revalidatePath('/admin/fund-compliance');
        revalidatePath('/my-finances');

        return { success: `Successfully topped up ₹${totalAmount} for ${member.name}.` };
    } catch (err) {
        console.error('topUpUserFunds error:', err);
        return { error: 'An unexpected error occurred.' };
    }
}

// ─── Custom Amount Top-Up ─────────────────────────────────────────────────────

export async function customTopUpUser(
    userId: string,
    amount: number,
    note?: string,
): Promise<{ success?: string; error?: string }> {
    // Split evenly between SF and GF
    const gfAmount = Math.floor(amount / 2);
    const sfAmount = amount - gfAmount;
    return topUpUserFunds(userId, sfAmount, gfAmount, note ?? 'Custom admin top-up');
}

// ─── Minimum Top-Up for single user ───────────────────────────────────────────

export async function minimumTopUpUser(
    userId: string,
): Promise<{ success?: string; error?: string }> {
    await dbConnect();
    const member = await User.findById(userId).lean();
    if (!member) return { error: 'Member not found.' };

    const activeLoans = await Loan.find({ user: userId, status: 'active' }).lean();
    const totalPrincipal = activeLoans.reduce((s, l) => s + l.principal, 0);

    const { sfTopUp, gfTopUp, isCompliant } = computeCompliance(
        member.shareFund ?? 0,
        member.guaranteedFund ?? 0,
        totalPrincipal,
    );

    if (isCompliant) return { success: 'Member is already compliant — no top-up needed.' };

    return topUpUserFunds(userId, sfTopUp, gfTopUp, 'Minimum compliance top-up');
}

// ─── Bulk Top-Up ──────────────────────────────────────────────────────────────

export async function bulkMinimumTopUp(
    userIds: string[],
): Promise<{ success?: string; error?: string }> {
    try {
        await dbConnect();
        const session = await getSession();
        const adminEmail = session?.user?.email ?? 'admin';

        const members = await User.find({ _id: { $in: userIds } }).lean();
        const activeLoans = await Loan.find({ user: { $in: userIds }, status: 'active' }).lean();

        const principalMap = new Map<string, number>();
        for (const loan of activeLoans) {
            const uid = loan.user.toString();
            principalMap.set(uid, (principalMap.get(uid) ?? 0) + loan.principal);
        }

        const now = new Date();
        let totalProcessed = 0;

        const updates = members
            .map(member => {
                const uid = member._id.toString();
                const principal = principalMap.get(uid) ?? 0;
                const { sfTopUp, gfTopUp, isCompliant } = computeCompliance(
                    member.shareFund ?? 0,
                    member.guaranteedFund ?? 0,
                    principal,
                );
                if (isCompliant || (sfTopUp + gfTopUp === 0)) return null;
                return { member, sfTopUp, gfTopUp };
            })
            .filter(Boolean) as { member: any; sfTopUp: number; gfTopUp: number }[];

        if (updates.length === 0) return { success: 'All selected members are already compliant.' };

        await Promise.all(
            updates.map(async ({ member, sfTopUp, gfTopUp }) => {
                const totalAmount = sfTopUp + gfTopUp;
                totalProcessed++;
                await User.updateOne(
                    { _id: member._id },
                    { $inc: { shareFund: sfTopUp, guaranteedFund: gfTopUp } },
                );
                await FundTopUp.create({
                    user: member._id,
                    sfAmount: sfTopUp,
                    gfAmount: gfTopUp,
                    totalAmount,
                    type: 'split',
                    note: 'Bulk minimum compliance top-up',
                    addedBy: adminEmail,
                    month: now.getMonth(),
                    year: now.getFullYear(),
                    includedInStatement: false,
                });
                await logAuditActivity({
                    action: 'fund_topup',
                    actor: adminEmail,
                    targetUserId: member._id.toString(),
                    details: `Bulk top-up: SF +₹${sfTopUp}, GF +₹${gfTopUp}. Reason: compliance.`,
                });
            }),
        );

        revalidatePath('/admin/fund-compliance');
        revalidatePath('/my-finances');

        return { success: `Successfully topped up ${totalProcessed} member(s).` };
    } catch (err) {
        console.error('bulkMinimumTopUp error:', err);
        return { error: 'An unexpected error occurred during bulk top-up.' };
    }
}

// ─── Auto-Adjust ALL ──────────────────────────────────────────────────────────

export async function autoAdjustAllFunds(): Promise<{ success?: string; error?: string }> {
    try {
        await dbConnect();
        const session = await getSession();
        const adminEmail = session?.user?.email ?? 'admin';

        const members = await User.find({
            role: { $in: ['member', 'board_member'] },
            status: 'active',
        }).lean();

        const memberIds = members.map(m => m._id);
        const activeLoans = await Loan.find({ user: { $in: memberIds }, status: 'active' }).lean();

        const principalMap = new Map<string, number>();
        for (const loan of activeLoans) {
            const uid = loan.user.toString();
            principalMap.set(uid, (principalMap.get(uid) ?? 0) + loan.principal);
        }

        const now = new Date();
        let totalAdjusted = 0;

        await Promise.all(
            members.map(async member => {
                const uid = member._id.toString();
                const principal = principalMap.get(uid) ?? 0;
                const { sfTopUp, gfTopUp, isCompliant } = computeCompliance(
                    member.shareFund ?? 0,
                    member.guaranteedFund ?? 0,
                    principal,
                );
                if (isCompliant) return;

                const totalAmount = sfTopUp + gfTopUp;
                totalAdjusted++;

                await User.updateOne(
                    { _id: member._id },
                    { $inc: { shareFund: sfTopUp, guaranteedFund: gfTopUp } },
                );
                await FundTopUp.create({
                    user: member._id,
                    sfAmount: sfTopUp,
                    gfAmount: gfTopUp,
                    totalAmount,
                    type: 'split',
                    note: 'Auto-adjust all: system compliance correction',
                    addedBy: adminEmail,
                    month: now.getMonth(),
                    year: now.getFullYear(),
                    includedInStatement: false,
                });
                await logAuditActivity({
                    action: 'fund_topup',
                    actor: adminEmail,
                    targetUserId: uid,
                    details: `Auto-adjust: SF +₹${sfTopUp}, GF +₹${gfTopUp} (total ₹${totalAmount}).`,
                });
            }),
        );

        revalidatePath('/admin/fund-compliance');
        revalidatePath('/my-finances');

        return {
            success:
                totalAdjusted === 0
                    ? 'All members are already compliant — no adjustments needed.'
                    : `Auto-adjusted ${totalAdjusted} member(s) to meet the 5% SF/GF requirement.`,
        };
    } catch (err) {
        console.error('autoAdjustAllFunds error:', err);
        return { error: 'An unexpected error occurred during auto-adjust.' };
    }
}
