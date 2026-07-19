"use server";

import dbConnect from "@/lib/mongodb";
import Loan, { ILoan } from "@/models/loan";
import User, { IUser } from "@/models/user";
import Bank from "@/models/bank";

interface PopulatedLoan extends ILoan {
    user: {
        _id: string;
        name: string;
        email: string;
    }
}

interface TotalCapital {
    shareFund: number;
    guaranteedFund: number;
    thriftFund: number;
    previousClosingBankBalance?: number;
    yearlyBankInterest?: number;
    total: number;
}

interface LedgerData {
    loans: PopulatedLoan[];
    totalCapital: TotalCapital;
}

export async function getLedgerData(): Promise<LedgerData> {
    await dbConnect();

    // Fetch all loans and populate user details
    const loans = await Loan.find({})
        .populate<{user: IUser}>({
            path: 'user',
            select: 'name email'
        })
        .sort({ createdAt: 'desc' })
        .lean();

    // Fetch bank settings
    const bank = await Bank.findOne({ singleton: 'bank-settings' });

    // Calculate total capital
    const capitalAggregation = await User.aggregate([
        {
            $group: {
                _id: null,
                totalShareFund: { $sum: '$shareFund' },
                totalGuaranteedFund: { $sum: '$guaranteedFund' },
                totalThriftFund: { $sum: '$thriftFund' }
            }
        }
    ]);
    
    const capital = capitalAggregation[0] || { totalShareFund: 0, totalGuaranteedFund: 0, totalThriftFund: 0 };
    const bankInterest = bank?.yearlyBankInterest || 0;
    const prevClosingBalance = bank?.previousClosingBankBalance || 0;
    
    const totalCapital: TotalCapital = {
        shareFund: capital.totalShareFund,
        guaranteedFund: capital.totalGuaranteedFund,
        thriftFund: capital.totalThriftFund,
        previousClosingBankBalance: prevClosingBalance,
        yearlyBankInterest: bankInterest,
        total: capital.totalShareFund + capital.totalGuaranteedFund + capital.totalThriftFund + bankInterest
    };

    return {
        loans: JSON.parse(JSON.stringify(loans)),
        totalCapital
    };
}
