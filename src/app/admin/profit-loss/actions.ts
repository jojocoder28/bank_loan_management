
"use server";

import dbConnect from "@/lib/mongodb";
import Loan from "@/models/loan";
import User from "@/models/user";
import Bank from "@/models/bank";
import { getBankSettings } from "../settings/actions";
import { startOfYear, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface ProfitLossData {
    totalIncome: number;
    totalExpense: number;
    incomeDetails: {
        loanInterest: number;
    };
    expenseDetails: {
        thriftFundInterest: number;
    };
    range: {
        from: Date;
        to: Date;
    }
}

function getDateRange(rangeKey: string): { from: Date, to: Date } {
    const now = new Date();
    switch (rangeKey) {
        case 'ytd':
            return { from: startOfYear(now), to: now };
        case 'mtd':
            return { from: startOfMonth(now), to: now };
        case 'last_month':
            const lastMonthStart = startOfMonth(subMonths(now, 1));
            const lastMonthEnd = endOfMonth(subMonths(now, 1));
            return { from: lastMonthStart, to: lastMonthEnd };
        case 'all':
        default:
            return { from: new Date(0), to: now }; // From the beginning of time
    }
}


export async function getProfitLossData(rangeKey: string): Promise<ProfitLossData> {
    await dbConnect();
    
    const range = getDateRange(rangeKey);
    const [bankSettings, activeLoans, members] = await Promise.all([
        getBankSettings(),
        Loan.find({ status: 'active', issueDate: { $lt: range.to } }).lean(),
        User.find({ role: 'member' }).select('thriftFund').lean(),
    ]);

    // 1. Calculate Income (Accrued Loan Interest)
    let totalLoanInterest = 0;
    for (const loan of activeLoans) {
        // Calculate the number of months the loan has been active within the date range
        const issueDate = new Date(loan.issueDate!);
        const startDate = issueDate > range.from ? issueDate : range.from;
        
        // Difference in months
        const diffInMonths = (range.to.getFullYear() - startDate.getFullYear()) * 12 + (range.to.getMonth() - startDate.getMonth());
        
        if(diffInMonths > 0) {
            // Simplified interest calculation for the P&L (does not compound)
            // A more accurate calculation would simulate monthly payments and interest accrual
            const monthlyInterestRate = (loan.interestRate / 100) / 12;
            const accruedInterestForLoan = loan.loanAmount * monthlyInterestRate * diffInMonths;
            totalLoanInterest += accruedInterestForLoan;
        }
    }

    // 2. Calculate Expenses (Accrued Thrift Fund Interest)
    const totalThriftFund = members.reduce((sum, member) => sum + (member.thriftFund || 0), 0);
    
    const daysInYear = 365; // Simple assumption
    const daysInRange = (range.to.getTime() - range.from.getTime()) / (1000 * 3600 * 24);

    const annualThriftInterestRate = bankSettings.thriftFundInterestRate / 100;
    const totalThriftInterest = (totalThriftFund * annualThriftInterestRate) * (daysInRange / daysInYear);

    return {
        totalIncome: Math.round(totalLoanInterest),
        totalExpense: Math.round(totalThriftInterest),
        incomeDetails: {
            loanInterest: Math.round(totalLoanInterest),
        },
        expenseDetails: {
            thriftFundInterest: Math.round(totalThriftInterest),
        },
        range
    };
}
