"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import Bank from "@/models/bank";
import FundTopUp from "@/models/fundTopUp";
import { getBankSettings } from "../settings/actions";
import { calculateDividend } from "@/lib/coop-calculations";
import { getSession } from "@/lib/session";
import { logAuditActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export interface DividendReportRow {
    memberId: string;
    name: string;
    membershipNumber: string;
    shareFund: number; // Share fund balance as of March of target year
    dividendRate: number;
    dividendAmount: number;
    finalShareFund: number; // Current actual share fund balance (view-only reference)
}

export async function getDividendReportData(dividendRate: number, targetYear: number): Promise<DividendReportRow[]> {
    await dbConnect();

    const [members, topups] = await Promise.all([
        User.find({ role: { $in: ['member', 'board_member'] }, status: 'active' }).sort({ name: 1 }).lean(),
        FundTopUp.find({ year: { $gte: targetYear } }).lean()
    ]);

    const reportData: DividendReportRow[] = members.map(member => {
        // Calculate share fund balance as of March of targetYear (subtracting post-March top-ups)
        let shareFundAsOfMarch = member.shareFund || 0;
        
        const userTopupsAfterMarch = topups.filter(t => 
            t.user.toString() === member._id.toString() && 
            (t.year * 12 + t.month) > (targetYear * 12 + 2) // month 2 is March (0-indexed)
        );

        const postMarchTopUpsSum = userTopupsAfterMarch.reduce((sum, t) => sum + (t.sfAmount || 0), 0);
        shareFundAsOfMarch = Math.max(0, shareFundAsOfMarch - postMarchTopUpsSum);

        const dividendAmount = Math.round(calculateDividend(shareFundAsOfMarch, dividendRate));
        const finalShareFund = member.shareFund || 0;

        return {
            memberId: member._id.toString(),
            name: member.name,
            membershipNumber: member.membershipNumber || 'N/A',
            shareFund: shareFundAsOfMarch,
            dividendRate,
            dividendAmount,
            finalShareFund,
        };
    });

    return reportData;
}

export async function applyAnnualDividends(
    dividendRate: number,
    targetYear: number,
    finalizedDividends: Array<{ memberId: string; dividendAmount: number }>
): Promise<{ error?: string; success?: boolean }> {
    try {
        await dbConnect();
        const bank = await Bank.findOne({ singleton: 'bank-settings' });
        if (!bank) {
            return { error: 'Bank settings not found.' };
        }

        const now = new Date();
        if (bank.lastDividendProcess) {
            const lastYear = new Date(bank.lastDividendProcess).getFullYear();
            if (lastYear === targetYear) {
                return { error: `Dividends have already been processed for the year ${targetYear}.` };
            }
        }

        // Apply dividends to each member
        const updatePromises = finalizedDividends.map(async (item) => {
            const user = await User.findById(item.memberId);
            if (user) {
                user.dividendFund = (user.dividendFund || 0) + item.dividendAmount;
                await user.save();
            }
        });

        await Promise.all(updatePromises);

        // Update process time
        bank.lastDividendProcess = now;
        await bank.save();

        const session = await getSession() as any;
        const actor = session?.email || 'Admin';
        const totalAmount = finalizedDividends.reduce((sum, item) => sum + item.dividendAmount, 0);

        await logAuditActivity(
            'ANNUAL_DIVIDENDS_PROCESSED',
            actor,
            undefined,
            `Processed annual share fund dividends for year ${targetYear} at ${dividendRate}% rate. Total distributed: ₹${totalAmount.toLocaleString()}.`,
            { dividendRate, totalAmount, count: finalizedDividends.length, year: targetYear }
        );

        revalidatePath('/admin/dividend');
        revalidatePath('/admin/ledger');
        revalidatePath('/admin/statement');
        revalidatePath('/my-finances');

        return { success: true };
    } catch (e: any) {
        console.error("Error applying annual dividends:", e);
        return { error: e.message || 'An error occurred.' };
    }
}
