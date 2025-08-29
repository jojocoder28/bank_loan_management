
"use server";

import dbConnect from "@/lib/mongodb";
import User, { IUser } from "@/models/user";
import Loan, { ILoan } from "@/models/loan";
import { getBankSettings } from "../settings/actions";
import { calculateMonthlyInterest } from "@/lib/coop-calculations";

export interface StatementRow {
    userId: string;
    name: string;
    membershipNumber: string;
    bankAccountNumber: string;
    shareFundContribution: number; // This is typically part of a loan, not a recurring monthly deduction. Will assume 0 for now unless specified.
    thriftFundContribution: number;
    loanPrincipalPayment: number;
    loanInterestPayment: number;
    totalDeduction: number;
    loanDetails: {
        id: string;
        outstandingPrincipal: number;
    } | null;
}

export async function getMonthlyStatementData(): Promise<StatementRow[]> {
    await dbConnect();

    const [members, bankSettings] = await Promise.all([
        User.find({ role: 'member' }).lean(),
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

    const statementData: StatementRow[] = members.map(member => {
        const thriftFundContribution = bankSettings.monthlyThriftContribution;
        const loan = loansByUserId.get(member._id.toString());
        
        let loanPrincipalPayment = 0;
        let loanInterestPayment = 0;
        let loanDetails: StatementRow['loanDetails'] = null;
        
        // SF is typically a one-time or loan-based contribution, not a recurring monthly one.
        // We'll set it to 0 for a standard monthly statement unless a loan specifies a shortfall top-up.
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

    return statementData.sort((a, b) => a.name.localeCompare(b.name));
}
