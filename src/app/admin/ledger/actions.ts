
"use server";

import dbConnect from "@/lib/mongodb";
import Loan, { ILoan } from "@/models/loan";
import User, { IUser } from "@/models/user";

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

    // Calculate total capital
    const capitalAggregation = await User.aggregate([
        {
            $match: { role: 'member' } // We only count capital from active members
        },
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
    
    const totalCapital: TotalCapital = {
        shareFund: capital.totalShareFund,
        guaranteedFund: capital.totalGuaranteedFund,
        thriftFund: capital.totalThriftFund,
        total: capital.totalShareFund + capital.totalGuaranteedFund + capital.totalThriftFund
    };

    return {
        loans: JSON.parse(JSON.stringify(loans)),
        totalCapital
    };
}
