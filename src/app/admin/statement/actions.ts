
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


export async function getMonthlyStatementData(): Promise<StatementRow[]> {
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

export async function getStatementSummary(): Promise<StatementSummary> {
    const data = await getMonthlyStatementData();
    
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
        const lastProcessed = bank?.lastAnnualAllProcess;
        if (lastProcessed && lastProcessed.getFullYear() === now.getFullYear()) {
            return { canProcess: false, message: `All annual dues have already been processed for ${now.getFullYear()}.` };
        }
    }
    
    return { canProcess: true, message: "" };
}

export async function processMonthlyDeductions(): Promise<{ error?: string; success?: string }> {
    const { canProcess, message } = await checkLastProcessed('monthly');
    if (!canProcess) {
        return { error: message };
    }

    try {
        await dbConnect();
        const [bankSettings, activeMembers, activeLoans] = await Promise.all([
            getBankSettings(),
            User.find({ role: 'member', status: 'active' }),
            Loan.find({ status: 'active' })
        ]);
        
        const monthlyThrift = bankSettings.monthlyThriftContribution;

        // 1. Update Thrift Funds for all members
        const memberUpdatePromises = activeMembers.map(member => {
            const currentThrift = member.thriftFund || 0;
            return User.updateOne({ _id: member._id }, { $set: { thriftFund: currentThrift + monthlyThrift } });
        });

        // 2. Update Loan Principals
        const loanUpdatePromises = activeLoans.map(loan => {
            const newPrincipal = Math.max(0, loan.principal - loan.monthlyPrincipalPayment);
            const newStatus = newPrincipal === 0 ? 'paid' : loan.status;
            return Loan.updateOne({ _id: loan._id }, { $set: { principal: newPrincipal, status: newStatus } });
        });

        await Promise.all([...memberUpdatePromises, ...loanUpdatePromises]);

        // 3. Update the last processed date
        await Bank.updateOne({ singleton: 'bank-settings' }, { $set: { lastMonthlyProcess: new Date() } });

        revalidatePath('/admin/statement');
        revalidatePath('/admin/ledger');
        revalidatePath('/my-finances');
        
        return { success: `Successfully processed monthly deductions for ${activeMembers.length} members and ${activeLoans.length} loans.` };

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
