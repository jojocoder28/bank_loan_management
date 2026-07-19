
"use server";

import dbConnect from "@/lib/mongodb";
import User, { IUser } from "@/models/user";
import Loan, { ILoan } from "@/models/loan";
import Bank from "@/models/bank";
import FundTopUp from "@/models/fundTopUp";
import Report from "@/models/report";
import { v2 as cloudinary } from "cloudinary";
import { getBankSettings } from "../settings/actions";
import { calculateAnnualInterest, calculateDividend, calculateMonthlyInterest } from "@/lib/coop-calculations";
import { revalidatePath } from "next/cache";
import { logAuditActivity } from "@/lib/audit";
import { getSession } from "@/lib/session";

export interface LoanInterestBreakdown {
    loanId: string;
    loanAmount: number;           // Original sanctioned amount
    outstandingPrincipal: number; // Current principal balance used for interest calc
    interestRate: number;         // Annual rate (%)
    monthlyInterest: number;      // Calculated monthly interest
    monthlyPrincipal: number;     // Monthly principal installment
    issueDate: string;            // ISO date
    tenure: number;               // Months
    formula: string;              // Human-readable formula string
}

export interface StatementRow {
    slNo: number;
    userId: string;
    name: string;
    membershipNumber: string;
    bankAccountNumber: string;
    shareFundContribution: number;
    thriftFundContribution: number;
    loanPrincipalPayment: number;
    loanInterestPayment: number;
    totalDeduction: number;
    loanDetails: {
        id: string;
        outstandingPrincipal: number;
    } | null;
    dividendFund?: number;
    loanBreakdown: LoanInterestBreakdown[]; // Per-loan interest breakdown for hover tooltip
}

export interface StatementSummary {
    totalThrift: number;
    totalShare: number;
    totalLoanPrincipal: number;
    totalLoanInterest: number;
    grandTotal: number;
}


export interface PendingMonth {
    month: number; // 0-indexed
    year: number;
    label: string;
}

export async function getPendingMonths(): Promise<PendingMonth[]> {
    await dbConnect();
    const bank = await Bank.findOne({ singleton: 'bank-settings' });
    const now = new Date();
    
    let startDate: Date;
    if (bank?.lastMonthlyProcess) {
        startDate = new Date(bank.lastMonthlyProcess);
        // Set to 1st of the month first in UTC to prevent timezone end-of-month rollover bugs
        startDate.setUTCDate(1);
        // Start from the month after lastMonthlyProcess
        startDate.setUTCMonth(startDate.getUTCMonth() + 1);
    } else {
        // Find oldest active loan issueDate or oldest member createdAt
        const oldestLoan = await Loan.findOne({ status: 'active' }).sort({ issueDate: 1 }).lean();
        const oldestUser = await User.findOne({ role: { $in: ['member', 'board_member'] } }).sort({ createdAt: 1 }).lean();
        
        const dates = [now];
        if (oldestLoan?.issueDate) dates.push(new Date(oldestLoan.issueDate));
        if (oldestUser?.createdAt) dates.push(new Date(oldestUser.createdAt));
        
        startDate = new Date(Math.min(...dates.map(d => d.getTime())));
        startDate.setUTCDate(1);
    }
    
    startDate.setUTCDate(1); // Set to 1st of the month
    
    const pending: PendingMonth[] = [];
    const checkDate = new Date(startDate);
    
    while (
        checkDate.getUTCFullYear() < now.getUTCFullYear() ||
        (checkDate.getUTCFullYear() === now.getUTCFullYear() && checkDate.getUTCMonth() <= now.getUTCMonth())
    ) {
        pending.push({
            month: checkDate.getUTCMonth(),
            year: checkDate.getUTCFullYear(),
            label: checkDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })
        });
        checkDate.setUTCMonth(checkDate.getUTCMonth() + 1);
    }
    
    if (pending.length === 0) {
        pending.push({
            month: now.getUTCMonth(),
            year: now.getUTCFullYear(),
            label: now.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })
        });
    }
    
    return pending;
}

export interface DeductionOverrideInput {
    userId: string;
    pauseDeduction: boolean;
    stopPrincipal: boolean;
    customThrift?: number;
    customPrincipal?: number;
    customInterest?: number;
}

export async function getMonthlyStatementData(month?: number, year?: number): Promise<StatementRow[]> {
    await dbConnect();

    let targetMonth = month;
    let targetYear = year;
    if (targetMonth === undefined || targetYear === undefined) {
        const pending = await getPendingMonths();
        targetMonth = pending[0].month;
        targetYear = pending[0].year;
    }

    const [members, bankSettings] = await Promise.all([
        User.find({ role: { $in: ['member', 'board_member'] }, status: 'active' }).sort({ name: 1 }).lean(),
        getBankSettings(),
    ]);

    const memberIds = members.map(m => m._id);

    const activeLoans = await Loan.find({
        user: { $in: memberIds },
        status: 'active'
    }).lean();

    const loansByUserId = new Map<string, ILoan[]>();
    for (const loan of activeLoans) {
        const userId = loan.user.toString();
        if (!loansByUserId.has(userId)) {
            loansByUserId.set(userId, []);
        }
        loansByUserId.get(userId)!.push(loan);
    }

    let slNoCounter = 1;
    const statementData: StatementRow[] = members.map(member => {
        const thriftFundContribution = bankSettings.monthlyThriftContribution;
        const userLoans = loansByUserId.get(member._id.toString()) || [];
        
        let loanPrincipalPayment = 0;
        let loanInterestPayment = 0;
        let totalOutstandingPrincipal = 0;
        let hasActiveLoan = false;
        let firstLoanId = "";
        const loanBreakdown: LoanInterestBreakdown[] = [];
        
        const shareFundContribution = 0;

        for (const loan of userLoans) {
            const isLoanStarted = loan.startYear === undefined || loan.startMonth === undefined ||
                (loan.startYear * 12 + loan.startMonth <= targetYear * 12 + targetMonth);

            if (isLoanStarted) {
                hasActiveLoan = true;
                if (!firstLoanId) {
                    firstLoanId = (loan._id as any).toString();
                }

                let principalPayment = loan.monthlyPrincipalPayment;

                // Check for approved temporary change_payment request that spans this targetMonth & targetYear
                const tempChangeRequest = loan.modificationRequests?.find(
                    (req: any) => {
                        if (req.type !== 'change_payment' || req.status !== 'approved' || req.requestType !== 'temporary') {
                            return false;
                        }
                        if (req.effectiveMonth === undefined || req.effectiveYear === undefined) {
                            return false;
                        }
                        const startVal = req.effectiveYear * 12 + req.effectiveMonth;
                        const targetVal = targetYear * 12 + targetMonth;
                        const duration = req.durationMonths || 1;
                        return targetVal >= startVal && targetVal < startVal + duration;
                    }
                );
                if (tempChangeRequest) {
                    principalPayment = tempChangeRequest.requestedValue;
                }

                const monthlyInterest = Math.round(calculateMonthlyInterest(loan.principal, loan.interestRate));
                loanPrincipalPayment += principalPayment;
                loanInterestPayment += monthlyInterest;
                totalOutstandingPrincipal += loan.principal;

                // Build per-loan breakdown for the interest tooltip
                loanBreakdown.push({
                    loanId: (loan._id as any).toString(),
                    loanAmount: loan.loanAmount,
                    outstandingPrincipal: loan.principal,
                    interestRate: loan.interestRate,
                    monthlyInterest,
                    monthlyPrincipal: principalPayment,
                    issueDate: loan.issueDate ? new Date(loan.issueDate).toISOString() : '',
                    tenure: loan.loanTenureMonths || 0,
                    formula: `₹${loan.principal.toLocaleString()} × ${loan.interestRate}% ÷ 12 = ₹${monthlyInterest.toLocaleString()}`,
                });
            }
        }

        const loanDetails = hasActiveLoan ? {
            id: firstLoanId,
            outstandingPrincipal: totalOutstandingPrincipal
        } : null;

        const totalDeduction = thriftFundContribution + loanPrincipalPayment + loanInterestPayment + shareFundContribution;

        return {
            slNo: slNoCounter++,
            userId: member._id.toString(),
            name: member.name,
            membershipNumber: member.membershipNumber || 'N/A',
            bankAccountNumber: member.bankAccountNumber || 'N/A',
            shareFundContribution,
            thriftFundContribution,
            loanPrincipalPayment,
            loanInterestPayment,
            totalDeduction,
            loanDetails,
            dividendFund: member.dividendFund || 0,
            loanBreakdown,
        };
    });

    return statementData;
}

export async function getStatementSummary(month?: number, year?: number): Promise<StatementSummary> {
    const data = await getMonthlyStatementData(month, year);
    
    const totals = data.reduce((acc, row) => {
        acc.totalThrift += row.thriftFundContribution;
        acc.totalShare += row.shareFundContribution;
        acc.totalLoanPrincipal += row.loanPrincipalPayment;
        acc.totalLoanInterest += row.loanInterestPayment;
        acc.grandTotal += row.totalDeduction;
        return acc;
    }, {
        totalThrift: 0,
        totalShare: 0,
        totalLoanPrincipal: 0,
        totalLoanInterest: 0,
        grandTotal: 0
    });

    return totals;
}


async function checkLastProcessed(key: 'monthly' | 'annual_all'): Promise<{ canProcess: boolean, message: string }> {
    const bank = await Bank.findOne({ singleton: 'bank-settings' });
    const now = new Date();

    if (key === 'monthly') {
        const lastProcessed = bank?.lastMonthlyProcess;
        if (lastProcessed && lastProcessed.getMonth() === now.getMonth() && lastProcessed.getFullYear() === now.getFullYear()) {
            return { canProcess: false, message: `Monthly deductions already processed for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}.` };
        }
    }
    
    if (key === 'annual_all') {
        // Bypass March check ONLY for the year 2026
        if (now.getMonth() !== 2 && now.getFullYear() !== 2026) {
             return { canProcess: false, message: "Annual dues can only be processed in the month of March." };
        }

        const lastProcessed = bank?.lastAnnualAllProcess;
        const lastProcessedYear = lastProcessed ? lastProcessed.getFullYear() : 0;
        if (now.getFullYear() !== 2026 && lastProcessedYear === now.getFullYear()) {
             return { canProcess: false, message: `All annual dues have already been processed for the year ${now.getFullYear()}.` };
        }
    }
    
    return { canProcess: true, message: "" };
}

export async function processMonthlyDeductions(
    targetMonth: number,
    targetYear: number,
    overrides: Record<string, DeductionOverrideInput> = {}
): Promise<{ error?: string; success?: string }> {
    await dbConnect();
    const bank = await Bank.findOne({ singleton: 'bank-settings' });
    
    if (bank?.lastMonthlyProcess) {
        const lastProcessed = new Date(bank.lastMonthlyProcess);
        const lastProcessedVal = lastProcessed.getFullYear() * 12 + lastProcessed.getMonth();
        const targetVal = targetYear * 12 + targetMonth;
        if (targetVal <= lastProcessedVal) {
            const lastProcessedLabel = lastProcessed.toLocaleString('default', { month: 'long', year: 'numeric' });
            return { error: `Deductions for ${lastProcessedLabel} or a later month have already been processed.` };
        }
    }

    try {
        const [bankSettings, activeMembers, activeLoans] = await Promise.all([
            getBankSettings(),
            User.find({ role: { $in: ['member', 'board_member'] }, status: 'active' }),
            Loan.find({ status: 'active' })
        ]);
        
        const monthlyThrift = bankSettings.monthlyThriftContribution;
        const targetMonthLabel = new Date(targetYear, targetMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        // 1. Update Thrift Funds for all members
        const memberUpdatePromises = activeMembers.map(member => {
            const currentThrift = member.thriftFund || 0;
            const override = overrides[(member._id as any).toString()];
            
            let thriftContribution = monthlyThrift;
            if (override) {
                if (override.pauseDeduction) {
                    thriftContribution = 0;
                } else if (override.customThrift !== undefined) {
                    thriftContribution = override.customThrift;
                }
            }

            return User.updateOne({ _id: member._id }, { $set: { thriftFund: currentThrift + thriftContribution } });
        });

        // 2. Update Loan Principals and push payments
        const loansByUserId = new Map<string, ILoan[]>();
        for (const loan of activeLoans) {
            const userId = (loan.user as any).toString();
            if (!loansByUserId.has(userId)) {
                loansByUserId.set(userId, []);
            }
            loansByUserId.get(userId)!.push(loan);
        }

        const loanUpdatePromises: Promise<any>[] = [];

        for (const [userId, userLoans] of loansByUserId.entries()) {
            const override = overrides[userId];

            // Filter user loans to started ones
            const startedLoans = userLoans.filter(loan => {
                return loan.startYear === undefined || loan.startMonth === undefined ||
                    (loan.startYear * 12 + loan.startMonth <= targetMonth + targetYear * 12);
            });

            // Map each started loan to its default principal and interest payment
            const loanPayments = startedLoans.map(loan => {
                let defaultPrincipal = loan.monthlyPrincipalPayment;
                
                // Check for approved temporary change_payment request that spans this targetMonth & targetYear
                const tempChangeRequest = loan.modificationRequests?.find(
                    (req: any) => {
                        if (req.type !== 'change_payment' || req.status !== 'approved' || req.requestType !== 'temporary') {
                            return false;
                        }
                        if (req.effectiveMonth === undefined || req.effectiveYear === undefined) {
                            return false;
                        }
                        const startVal = req.effectiveYear * 12 + req.effectiveMonth;
                        const targetVal = targetYear * 12 + targetMonth;
                        const duration = req.durationMonths || 1;
                        return targetVal >= startVal && targetVal < startVal + duration;
                    }
                );
                if (tempChangeRequest) {
                    defaultPrincipal = tempChangeRequest.requestedValue;
                }

                const defaultInterest = Math.round(calculateMonthlyInterest(loan.principal, loan.interestRate));
                
                return {
                    loan,
                    principalPayment: defaultPrincipal,
                    interestPayment: defaultInterest,
                };
            });

            // Apply overrides if any
            if (override) {
                if (override.pauseDeduction) {
                    for (const lp of loanPayments) {
                        lp.principalPayment = 0;
                        lp.interestPayment = 0;
                    }
                } else if (override.stopPrincipal) {
                    for (const lp of loanPayments) {
                        lp.principalPayment = 0;
                    }
                    if (override.customInterest !== undefined) {
                        // Distribute customInterest sequentially among the started loans
                        let interestRem = override.customInterest;
                        for (const lp of loanPayments) {
                            const defInt = lp.interestPayment;
                            lp.interestPayment = Math.min(interestRem, defInt);
                            interestRem -= lp.interestPayment;
                        }
                        // If there is still remaining interest, add to the first loan
                        if (interestRem > 0 && loanPayments.length > 0) {
                            loanPayments[0].interestPayment += interestRem;
                        }
                    }
                } else {
                    // Custom override mode
                    if (override.customPrincipal !== undefined) {
                        // Distribute customPrincipal sequentially among the started loans
                        let principalRem = override.customPrincipal;
                        // First pass: pay up to default monthly principal payment, capped by outstanding principal
                        for (const lp of loanPayments) {
                            const limit = Math.min(principalRem, lp.loan.principal, lp.principalPayment);
                            lp.principalPayment = limit;
                            principalRem -= limit;
                        }
                        // Second pass: distribute remaining principalRem to any loan up to its outstanding principal
                        if (principalRem > 0) {
                            for (const lp of loanPayments) {
                                const extra = Math.min(principalRem, lp.loan.principal - lp.principalPayment);
                                lp.principalPayment += extra;
                                principalRem -= extra;
                            }
                        }
                    }
                    if (override.customInterest !== undefined) {
                        // Distribute customInterest sequentially among the started loans
                        let interestRem = override.customInterest;
                        for (const lp of loanPayments) {
                            const defInt = lp.interestPayment;
                            lp.interestPayment = Math.min(interestRem, defInt);
                            interestRem -= lp.interestPayment;
                        }
                        if (interestRem > 0 && loanPayments.length > 0) {
                            loanPayments[0].interestPayment += interestRem;
                        }
                    }
                }
            }

            // Generate update promises
            for (const lp of loanPayments) {
                const loan = lp.loan;
                let principalPayment = lp.principalPayment;
                let interestPayment = lp.interestPayment;

                principalPayment = Math.min(principalPayment, loan.principal);
                const newPrincipal = Math.max(0, loan.principal - principalPayment);
                const newStatus = newPrincipal === 0 ? 'paid' : loan.status;

                const paymentsToPush = [];
                if (principalPayment > 0) {
                    paymentsToPush.push({
                        amount: principalPayment,
                        date: new Date(),
                        type: 'principal',
                        notes: `Monthly principal deduction for ${targetMonthLabel}`
                    });
                }
                if (interestPayment > 0) {
                    paymentsToPush.push({
                        amount: interestPayment,
                        date: new Date(),
                        type: 'interest',
                        notes: `Monthly interest deduction for ${targetMonthLabel}`
                    });
                }

                const updateFields: any = { principal: newPrincipal, status: newStatus };
                const updateQuery: any = { $set: updateFields };
                if (paymentsToPush.length > 0) {
                    updateQuery.$push = { payments: { $each: paymentsToPush } };
                }

                loanUpdatePromises.push(Loan.updateOne({ _id: loan._id }, updateQuery));
            }
        }

        await Promise.all([...memberUpdatePromises, ...loanUpdatePromises]);

        // 3. Update the last processed date to the middle of the target month
        const processedDate = new Date(targetYear, targetMonth, 15);
        await Bank.updateOne({ singleton: 'bank-settings' }, { $set: { lastMonthlyProcess: processedDate } });

        const session = await getSession() as any;
        const actor = session?.email || 'Admin';
        await logAuditActivity(
            'MONTHLY_DEDUCTION_PROCESSED',
            actor,
            undefined,
            `Processed monthly thrift, share, and loan interest/principal deductions for ${targetMonthLabel}.`,
            { month: targetMonthLabel }
        );

        revalidatePath('/admin/statement');
        revalidatePath('/admin/ledger');
        revalidatePath('/my-finances');
        
        return { success: `Successfully processed monthly deductions for ${targetMonthLabel}.` };

    } catch (e: any) {
        return { error: e.message || "An unknown error occurred." };
    }
}


export interface AnnualDuesPreviewRow {
    memberId: string;
    name: string;
    membershipNumber: string;
    gfBalance: number;
    gfInterest: number;
    // TF breakdown fields
    tfBalance: number;            // March TF balance (estimate)
    tfOpeningBalance: number;     // March TF minus this year's 12 contributions
    tfYearlyContribution: number; // 12 × monthly (this year's contribution portion)
    tfInterestOnOpening: number;  // tfOpeningBalance × rate
    tfInterestOnNew: number;      // 12 × monthly × rate
    tfInterest: number;           // total = tfInterestOnOpening + tfInterestOnNew
}

export async function getAnnualDuesPreviewData(
    gfRate: number,
    tfRate: number,
    targetYear: number
): Promise<AnnualDuesPreviewRow[]> {
    await dbConnect();
    const [bankSettings, activeMembers, bank, topups] = await Promise.all([
        getBankSettings(),
        User.find({ role: { $in: ['member', 'board_member'] }, status: 'active' }).sort({ name: 1 }).lean(),
        Bank.findOne({ singleton: 'bank-settings' }).lean(),
        FundTopUp.find({ year: { $gte: targetYear } }).lean(),
    ]);

    if (!bankSettings) {
        throw new Error('Bank settings are not configured.');
    }

    const monthlyThrift = bankSettings.monthlyThriftContribution;
    const tfRateDecimal = tfRate / 100;

    // Calculate how many monthly statement cycles have been processed AFTER March of targetYear
    const marchValue = targetYear * 12 + 2; // March (0-indexed month 2)
    let monthsProcessedAfterMarch = 0;
    if (bank?.lastMonthlyProcess) {
        const lastProcessed = new Date(bank.lastMonthlyProcess);
        const lastProcessedValue = lastProcessed.getFullYear() * 12 + lastProcessed.getMonth();
        if (lastProcessedValue > marchValue) {
            monthsProcessedAfterMarch = lastProcessedValue - marchValue;
        }
    }

    const previewRows: AnnualDuesPreviewRow[] = activeMembers.map(member => {
        const memberId = member._id.toString();

        // --- Guaranteed Fund as of March ---
        // GF only changes via FundTopUp entries, so subtract post-March GF top-ups
        const postMarchGfTopups = topups.filter(t =>
            t.user.toString() === memberId &&
            (t.year * 12 + t.month) > marchValue
        );
        const postMarchGfSum = postMarchGfTopups.reduce((sum, t) => sum + (t.gfAmount || 0), 0);
        const gfBalance = Math.max(0, (member.guaranteedFund || 0) - postMarchGfSum);
        const gfInterest = Math.round(calculateAnnualInterest(gfBalance, gfRate));

        // --- Thrift Fund as of March (ESTIMATE) ---
        // TF changes each month via monthly contributions + manual top-ups.
        // Best-effort: subtract post-March monthly cycles and top-ups from current balance.
        // WARNING: Inaccurate for members with paused/custom/skipped contributions — admin should verify.
        const postMarchTfTopups = topups.filter(t =>
            t.user.toString() === memberId &&
            (t.year * 12 + t.month) > marchValue
        );
        const postMarchTfTopupSum = postMarchTfTopups.reduce((sum, t) => sum + ((t.sfAmount === 0 && t.gfAmount === 0) ? t.totalAmount : 0), 0);
        const tfContributionsAfterMarch = monthsProcessedAfterMarch * monthlyThrift;
        const tfBalance = Math.max(0, (member.thriftFund || 0) - tfContributionsAfterMarch - postMarchTfTopupSum);

        // --- TF Interest Formula ---
        // The March TF balance = opening balance (before this year) + 12 monthly contributions of this year.
        // Step 1: opening balance = marchTf - (12 × monthly)
        // Step 2: interestOnOpening = openingBalance × rate  (full year interest on existing balance)
        // Step 3: interestOnNew = 12 × monthly × rate        (full year interest on this year's contributions)
        // Total TF interest = interestOnOpening + interestOnNew = tfBalance × rate
        const yearlyContribution = 12 * monthlyThrift;
        const tfOpeningBalance = Math.max(0, tfBalance - yearlyContribution);
        const tfInterestOnOpening = Math.round(tfOpeningBalance * tfRateDecimal);
        // 78 = 1+2+...+12: prorated sum-of-digits formula for monthly deposits through the year
        const tfInterestOnNew = Math.round(78 * monthlyThrift * (tfRateDecimal / 12));
        const tfInterest = tfInterestOnOpening + tfInterestOnNew;

        return {
            memberId,
            name: member.name,
            membershipNumber: member.membershipNumber || 'N/A',
            gfBalance,
            gfInterest,
            tfBalance,
            tfOpeningBalance,
            tfYearlyContribution: yearlyContribution,
            tfInterestOnOpening,
            tfInterestOnNew,
            tfInterest,
        };
    });

    return previewRows;
}

export async function applyAnnualDues(
    targetYear: number,
    gfRate: number,
    tfRate: number,
    finalizedDues: Array<{ memberId: string; gfInterest: number; tfInterest: number }>
): Promise<{ error?: string; success?: boolean }> {
    try {
        await dbConnect();
        
        if (targetYear !== 2026) {
            const { canProcess, message } = await checkLastProcessed('annual_all');
            if (!canProcess) {
                return { error: message };
            }
        }

        const bank = await Bank.findOne({ singleton: 'bank-settings' });
        if (!bank) {
            return { error: 'Bank settings not found.' };
        }

        const updatePromises = finalizedDues.map(async (item) => {
            const user = await User.findById(item.memberId);
            if (user) {
                user.guaranteedFund = (user.guaranteedFund || 0) + item.gfInterest;
                user.thriftFund = (user.thriftFund || 0) + item.tfInterest;
                await user.save();
            }
        });

        await Promise.all(updatePromises);

        bank.lastAnnualAllProcess = new Date();
        await bank.save();

        const session = await getSession() as any;
        const actor = session?.email || 'Admin';
        const totalGfInterest = finalizedDues.reduce((sum, item) => sum + item.gfInterest, 0);
        const totalTfInterest = finalizedDues.reduce((sum, item) => sum + item.tfInterest, 0);
        const totalInterest = totalGfInterest + totalTfInterest;

        await logAuditActivity(
            'ANNUAL_DUES_PROCESSED',
            actor,
            undefined,
            `Processed annual dues for year ${targetYear} (GF Interest: ${gfRate}%, TF Interest: ${tfRate}%). Total distributed: ₹${totalInterest.toLocaleString()}.`,
            { gfRate, tfRate, totalGfInterest, totalTfInterest, count: finalizedDues.length, year: targetYear }
        );

        revalidatePath('/admin/statement');
        revalidatePath('/admin/ledger');
        revalidatePath('/my-finances');

        return { success: true };
    } catch (e: any) {
        console.error("Error applying annual dues:", e);
        return { error: e.message || 'An error occurred.' };
    }
}

export async function processAllAnnualDues(): Promise<{ error?: string; success?: string }> {
     const { canProcess, message } = await checkLastProcessed('annual_all');
    if (!canProcess) {
        return { error: message };
    }
    
    try {
        await dbConnect();
        const [bankSettings, activeMembers] = await Promise.all([
            getBankSettings(),
            User.find({ role: { $in: ['member', 'board_member'] }, status: 'active' }),
        ]);

        if (!bankSettings) {
            return { error: 'Bank settings are not configured.' };
        }

        const gfInterestRate = bankSettings.guaranteedFundInterestRate;
        const monthlyThrift = bankSettings.monthlyThriftContribution;
        const tfInterestRate = bankSettings.thriftFundInterestRate / 100;

        const thriftInterestAmount = 78 * monthlyThrift * (tfInterestRate / 12);

        const memberUpdatePromises = activeMembers.map(member => {
            const currentThrift = member.thriftFund || 0;
            const newThriftFund = currentThrift + thriftInterestAmount;

            const currentGF = member.guaranteedFund || 0;
            const gfInterestAmount = calculateAnnualInterest(currentGF, gfInterestRate);
            const newGF = currentGF + gfInterestAmount;
            
            return User.updateOne({ _id: member._id }, { 
                $set: { 
                    thriftFund: newThriftFund,
                    guaranteedFund: newGF
                } 
            });
        });

        await Promise.all(memberUpdatePromises);
        
        // Update the master annual process date
        await Bank.updateOne({ singleton: 'bank-settings' }, { $set: { lastAnnualAllProcess: new Date() } });
        
        revalidatePath('/admin/statement');
        revalidatePath('/admin/ledger');
        revalidatePath('/admin/dividend');
        revalidatePath('/my-finances');

        return { success: `Successfully processed all annual dues for ${activeMembers.length} members.` };

    } catch (e: any) {
        return { error: e.message || "An unknown error occurred." };
    }
}

export async function undoLastMonthlyProcess(): Promise<{ error?: string; success?: string }> {
    await dbConnect();
    const bank = await Bank.findOne({ singleton: 'bank-settings' });
    if (!bank?.lastMonthlyProcess) {
        return { error: "No monthly deductions have been processed yet." };
    }

    const lastProcessed = new Date(bank.lastMonthlyProcess);
    const targetMonth = lastProcessed.getMonth();
    const targetYear = lastProcessed.getFullYear();
    const targetMonthLabel = lastProcessed.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Prevent undoing the baseline Excel import (March 31, 2026)
    const baseTime = new Date('2026-03-31T23:59:59.000Z').getTime();
    if (lastProcessed.getTime() <= baseTime) {
        return { error: "Cannot undo the baseline Excel import data." };
    }

    try {
        const [bankSettings, activeMembers, allLoans] = await Promise.all([
            getBankSettings(),
            User.find({ role: { $in: ['member', 'board_member'] }, status: 'active' }),
            Loan.find({ status: { $in: ['active', 'paid'] } })
        ]);

        const monthlyThrift = bankSettings.monthlyThriftContribution;

        // 1. Revert Loan principal and payments
        const loanUpdatePromises = allLoans.map(async (loan) => {
            const matchNotes = `for ${targetMonthLabel}`;
            const paymentsToRevert = loan.payments.filter((p: any) => p.notes && p.notes.includes(matchNotes));
            
            if (paymentsToRevert.length === 0) {
                return;
            }

            // Sum principal payments
            const principalSum = paymentsToRevert
                .filter((p: any) => p.type === 'principal')
                .reduce((sum: number, p: any) => sum + p.amount, 0);

            // Filter out these payments
            const updatedPayments = loan.payments.filter((p: any) => !p.notes || !p.notes.includes(matchNotes));

            const newPrincipal = loan.principal + principalSum;
            // Restore status to active if it was paid
            const newStatus = newPrincipal > 0 ? 'active' : loan.status;

            return Loan.updateOne(
                { _id: loan._id },
                { 
                    $set: { 
                        principal: newPrincipal, 
                        status: newStatus,
                        payments: updatedPayments
                    }
                }
            );
        });

        // 2. Revert Member Thrift fund accumulations
        const memberUpdatePromises = activeMembers.map(async (member) => {
            const loan = allLoans.find(l => (l.user as any).toString() === (member._id as any).toString());
            let thriftToSubtract = monthlyThrift;
            
            if (loan) {
                const matchNotes = `for ${targetMonthLabel}`;
                const paymentsForMonth = loan.payments.filter((p: any) => p.notes && p.notes.includes(matchNotes));
                // If they had a loan but no payments for this month, they were paused
                if (paymentsForMonth.length === 0) {
                    thriftToSubtract = 0;
                }
            }

            const currentThrift = member.thriftFund || 0;
            const newThrift = Math.max(0, currentThrift - thriftToSubtract);

            return User.updateOne(
                { _id: member._id },
                { $set: { thriftFund: newThrift } }
            );
        });

        await Promise.all([...loanUpdatePromises.filter(Boolean), ...memberUpdatePromises]);

        // 3. Roll back lastMonthlyProcess date by 1 month
        const prevDate = new Date(targetYear, targetMonth - 1, 15);
        
        // If the rolled back month is March 2026, set it to the exact March 31 base import date
        if (targetYear === 2026 && targetMonth === 3) { // April is index 3
            await Bank.updateOne(
                { singleton: 'bank-settings' },
                { $set: { lastMonthlyProcess: new Date('2026-03-31T23:59:59.000Z') } }
            );
        } else {
            await Bank.updateOne(
                { singleton: 'bank-settings' },
                { $set: { lastMonthlyProcess: prevDate } }
            );
        }

        const session = await getSession() as any;
        const actor = session?.email || 'Admin';
        await logAuditActivity(
            'MONTHLY_DEDUCTION_UNDONE',
            actor,
            undefined,
            `Rolled back and undone monthly deductions for ${targetMonthLabel}.`,
            { month: targetMonthLabel }
        );

        revalidatePath('/admin/statement');
        revalidatePath('/admin/ledger');
        revalidatePath('/my-finances');

        return { success: `Successfully rolled back all deductions for ${targetMonthLabel}.` };

    } catch (e: any) {
        return { error: e.message || "An unknown error occurred during rollback." };
    }
}

export async function getLastProcessedMonthInfo(): Promise<{ canUndo: boolean; lastProcessedLabel: string | null }> {
    await dbConnect();
    const bank = await Bank.findOne({ singleton: 'bank-settings' });
    if (!bank?.lastMonthlyProcess) {
        return { canUndo: false, lastProcessedLabel: null };
    }
    const lastDate = new Date(bank.lastMonthlyProcess);
    const lastProcessedLabel = lastDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    
    // Can only undo if it's after March 31, 2026 baseline import
    const baseTime = new Date('2026-03-31T23:59:59.000Z').getTime();
    const canUndo = lastDate.getTime() > baseTime;

    return { canUndo, lastProcessedLabel };
}

export async function uploadProcessedReport(
    title: string,
    type: 'monthly_statement' | 'yearly_dues' | 'dividend',
    year: number,
    month: number | undefined,
    pdfBase64?: string,
    csvString?: string
): Promise<{ error?: string; success?: boolean; pdfUrl?: string; csvUrl?: string }> {
    try {
        await dbConnect();
        
        const session = await getSession() as any;
        if (!session || session.role !== 'admin') {
            return { error: "Unauthorized. Admin role required." };
        }

        // Configure Cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        let pdfUrl: string | undefined = undefined;
        let csvUrl: string | undefined = undefined;

        // Upload PDF if provided
        if (pdfBase64) {
            const pdfBuffer = Buffer.from(pdfBase64, 'base64');
            const pdfUpload = await new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "coop_statements/pdf",
                        resource_type: "raw",
                        public_id: `${type}_${year}_${month !== undefined ? month : ''}_pdf`,
                        overwrite: true
                    },
                    (err, result) => err ? reject(err) : resolve(result)
                );
                uploadStream.end(pdfBuffer);
            });
            pdfUrl = pdfUpload.secure_url;
        }

        // Upload CSV if provided
        if (csvString) {
            const csvBuffer = Buffer.from(csvString, 'utf-8');
            const csvUpload = await new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "coop_statements/csv",
                        resource_type: "raw",
                        public_id: `${type}_${year}_${month !== undefined ? month : ''}_csv`,
                        overwrite: true
                    },
                    (err, result) => err ? reject(err) : resolve(result)
                );
                uploadStream.end(csvBuffer);
            });
            csvUrl = csvUpload.secure_url;
        }

        // Save report entry in MongoDB (create or update)
        const query: any = { type, year };
        if (month !== undefined) {
            query.month = month;
        }
        
        await Report.findOneAndUpdate(
            query,
            {
                $set: {
                    title,
                    pdfUrl,
                    csvUrl,
                }
            },
            { upsert: true, new: true }
        );

        revalidatePath('/admin/reports');
        return { success: true, pdfUrl, csvUrl };
    } catch (e: any) {
        console.error("Failed to upload report to Cloudinary:", e);
        return { error: e.message || "Failed to upload files to Cloudinary." };
    }
}

export async function getReportsArchive(): Promise<any[]> {
    try {
        await dbConnect();
        const reports = await Report.find({}).sort({ createdAt: -1 }).lean();
        return JSON.parse(JSON.stringify(reports));
    } catch (e: any) {
        console.error("Failed to fetch reports archive:", e);
        return [];
    }
}
