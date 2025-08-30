
"use server";

import dbConnect from "@/lib/mongodb";
import User, { IUser } from "@/models/user";
import Loan, { ILoan } from "@/models/loan";
import { getBankSettings } from "../settings/actions";
import { calculateMonthlyInterest } from "@/lib/coop-calculations";

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
