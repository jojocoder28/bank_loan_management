
'use server';

import { getSession } from '@/lib/session';
import dbConnect from '@/lib/mongodb';
import User, { IUser } from '@/models/user';
import Loan, { ILoan } from '@/models/loan';

export interface DashboardData {
    user: {
        name: string;
        role: IUser['role'];
        membershipNumber?: string | null;
        shareFund: number;
        guaranteedFund: number;
        thriftFund?: number;
    };
    activeLoans: ILoan[];
    loanHistory: ILoan[];
}

export async function getDashboardData(): Promise<DashboardData | null> {
    const session = await getSession();
    if (!session) {
        return null;
    }

    try {
        await dbConnect();
        const user = await User.findById(session.id).lean();
        if (!user) {
            return null;
        }

        const activeLoans = await Loan.find({ user: user._id, status: 'active' }).lean();
        const loanHistory = await Loan.find({ 
            user: user._id, 
            status: { $in: ['paid', 'rejected', 'pending'] } 
        }).sort({ createdAt: -1 }).limit(5).lean();

        return {
            user: {
                name: user.name,
                role: user.role,
                membershipNumber: user.membershipNumber || null,
                shareFund: user.shareFund || 0,
                guaranteedFund: user.guaranteedFund || 0,
                thriftFund: user.thriftFund || 0
            },
            activeLoans: JSON.parse(JSON.stringify(activeLoans)),
            loanHistory: JSON.parse(JSON.stringify(loanHistory)),
        };

    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        return null;
    }
}
