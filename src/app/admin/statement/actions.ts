
"use server";

import dbConnect from "@/lib/mongodb";
import User, { IUser } from "@/models/user";
import Loan, { ILoan } from "@/models/loan";
import Bank from "@/models/bank";
import { getBankSettings } from "../settings/actions";
import { calculateAnnualInterest, calculateDividend, calculateMonthlyInterest } from "@/lib/coop-calculations";
import { revalidatePath } from "next/cache";

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
        const oldestUser = await User.findOne({ role: 'member' }).sort({ createdAt: 1 }).lean();
        
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
        User.find({ role: 'member', status: 'active' }).sort({ name: 1 }).lean(),
        getBankSettings(),
    ]);

    const memberIds = members.map(m => m._id);

    const activeLoans = await Loan.find({
        user: { $in: memberIds },
        status: 'active'
    }).lean();

    const loansByUserId = new Map<string, ILoan>();
    for (const loan of activeLoans) {
        loansByUserId.set(loan.user.toString(), loan);
    }

    let slNoCounter = 1;
    const statementData: StatementRow[] = members.map(member => {
        const thriftFundContribution = bankSettings.monthlyThriftContribution;
        const loan = loansByUserId.get(member._id.toString());
        
        let loanPrincipalPayment = 0;
        let loanInterestPayment = 0;
        let loanDetails: StatementRow['loanDetails'] = null;
        
        const shareFundContribution = 0;

        if (loan) {
            loanPrincipalPayment = loan.monthlyPrincipalPayment;
            
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
                loanPrincipalPayment = tempChangeRequest.requestedValue;
            }

            loanInterestPayment = Math.round(calculateMonthlyInterest(loan.principal, loan.interestRate));
            loanDetails = {
                id: loan._id.toString(),
                outstandingPrincipal: loan.principal
            };
        }

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
        if (now.getMonth() !== 2) { // 2 corresponds to March (0-indexed)
             return { canProcess: false, message: "Annual dues can only be processed in the month of March." };
        }

        const lastProcessed = bank?.lastAnnualAllProcess;
        if (lastProcessed && lastProcessed.getFullYear() === now.getFullYear()) {
            return { canProcess: false, message: `All annual dues have already been processed for ${now.getFullYear()}.` };
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
            User.find({ role: 'member', status: 'active' }),
            Loan.find({ status: 'active' })
        ]);
        
        const monthlyThrift = bankSettings.monthlyThriftContribution;
        const targetMonthLabel = new Date(targetYear, targetMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

        // 1. Update Thrift Funds for all members
        const memberUpdatePromises = activeMembers.map(member => {
            const currentThrift = member.thriftFund || 0;
            const override = overrides[member._id.toString()];
            
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
        const loanUpdatePromises = activeLoans.map(loan => {
            const override = overrides[loan.user.toString()];
            
            let principalPayment = loan.monthlyPrincipalPayment;
            let interestPayment = Math.round(calculateMonthlyInterest(loan.principal, loan.interestRate));

            if (override) {
                if (override.pauseDeduction) {
                    principalPayment = 0;
                    interestPayment = 0;
                } else if (override.stopPrincipal) {
                    principalPayment = 0;
                    if (override.customInterest !== undefined) {
                        interestPayment = override.customInterest;
                    }
                } else {
                    if (override.customPrincipal !== undefined) {
                        principalPayment = override.customPrincipal;
                    }
                    if (override.customInterest !== undefined) {
                        interestPayment = override.customInterest;
                    }
                }
            }

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

            return Loan.updateOne({ _id: loan._id }, updateQuery);
        });

        await Promise.all([...memberUpdatePromises, ...loanUpdatePromises]);

        // 3. Update the last processed date to the middle of the target month
        const processedDate = new Date(targetYear, targetMonth, 15);
        await Bank.updateOne({ singleton: 'bank-settings' }, { $set: { lastMonthlyProcess: processedDate } });

        revalidatePath('/admin/statement');
        revalidatePath('/admin/ledger');
        revalidatePath('/my-finances');
        
        return { success: `Successfully processed monthly deductions for ${targetMonthLabel}.` };

    } catch (e: any) {
        return { error: e.message || "An unknown error occurred." };
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
            User.find({ role: 'member', status: 'active' }),
        ]);

        // Interest calculation values
        const monthlyThrift = bankSettings.monthlyThriftContribution;
        const tfInterestRate = bankSettings.thriftFundInterestRate / 100;
        const gfInterestRate = bankSettings.guaranteedFundInterestRate;
        const sfDividendRate = bankSettings.shareFundDividendRate;

        // Formula for TF: 78 * MonthlyContribution * (InterestRate / 12)
        const thriftInterestAmount = 78 * monthlyThrift * (tfInterestRate / 12);

        const memberUpdatePromises = activeMembers.map(member => {
            // 1. Thrift Fund Update
            const currentThrift = member.thriftFund || 0;
            const newThriftFund = currentThrift + thriftInterestAmount;

            // 2. Guaranteed Fund Update
            const currentGF = member.guaranteedFund || 0;
            const gfInterestAmount = calculateAnnualInterest(currentGF, gfInterestRate);
            const newGF = currentGF + gfInterestAmount;
            
            // 3. Share Fund Update (Dividend)
            const currentSF = member.shareFund || 0;
            const sfDividendAmount = calculateDividend(currentSF, sfDividendRate);
            const newSF = currentSF + sfDividendAmount;

            return User.updateOne({ _id: member._id }, { 
                $set: { 
                    thriftFund: newThriftFund,
                    guaranteedFund: newGF,
                    shareFund: newSF
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
            User.find({ role: 'member', status: 'active' }),
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
            const loan = allLoans.find(l => l.user.toString() === member._id.toString());
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
