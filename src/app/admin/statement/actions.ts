
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
        // Set to 1st of the month first to prevent JavaScript end-of-month rollover bugs (e.g. March 31 + 1 month rolling to May 1)
        startDate.setDate(1);
        // Start from the month after lastMonthlyProcess
        startDate.setMonth(startDate.getMonth() + 1);
    } else {
        // Find oldest active loan issueDate or oldest member createdAt
        const oldestLoan = await Loan.findOne({ status: 'active' }).sort({ issueDate: 1 }).lean();
        const oldestUser = await User.findOne({ role: 'member' }).sort({ createdAt: 1 }).lean();
        
        const dates = [now];
        if (oldestLoan?.issueDate) dates.push(new Date(oldestLoan.issueDate));
        if (oldestUser?.createdAt) dates.push(new Date(oldestUser.createdAt));
        
        startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    }
    
    startDate.setDate(1); // Set to 1st of the month
    
    const pending: PendingMonth[] = [];
    const checkDate = new Date(startDate);
    
    while (
        checkDate.getFullYear() < now.getFullYear() ||
        (checkDate.getFullYear() === now.getFullYear() && checkDate.getMonth() <= now.getMonth())
    ) {
        pending.push({
            month: checkDate.getMonth(),
            year: checkDate.getFullYear(),
            label: checkDate.toLocaleString('default', { month: 'long', year: 'numeric' })
        });
        checkDate.setMonth(checkDate.getMonth() + 1);
    }
    
    if (pending.length === 0) {
        pending.push({
            month: now.getMonth(),
            year: now.getFullYear(),
            label: now.toLocaleString('default', { month: 'long', year: 'numeric' })
        });
    }
    
    return pending;
}

export interface DeductionOverrideInput {
    userId: string;
    pauseDeduction: boolean;
    stopCapital: boolean;
    customThrift?: number;
    customPrincipal?: number;
    customInterest?: number;
}

export async function getMonthlyStatementData(month?: number, year?: number): Promise<StatementRow[]> {
    await dbConnect();

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
                if (override.pauseDeduction || override.stopCapital) {
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
