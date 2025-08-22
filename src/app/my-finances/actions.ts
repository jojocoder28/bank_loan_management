
'use server';

import { getSession } from '@/lib/session';
import dbConnect from '@/lib/mongodb';
import User, { IUser } from '@/models/user';
import Loan, { ILoan } from '@/models/loan';

export interface FinancesData {
    user: {
        name: string;
        role: IUser['role'];
        shareFund: number;
        guaranteedFund: number;
    };
    allLoans: ILoan[];
}

export async function getMyFinancesData(): Promise<FinancesData | null> {
    const session = await getSession();
    if (!session || session.role !== 'member') {
        return null;
    }

    try {
        await dbConnect();
        const user = await User.findById(session.id).lean();
        if (!user) {
            return null;
        }

        const allLoans = await Loan.find({ user: user._id }).sort({ createdAt: -1 }).lean();

        return {
            user: {
                name: user.name,
                role: user.role,
                shareFund: user.shareFund || 0,
                guaranteedFund: user.guaranteedFund || 0,
            },
            allLoans: JSON.parse(JSON.stringify(allLoans)),
        };

    } catch (error) {
        console.error("Failed to fetch finances data:", error);
        return null;
    }
}
