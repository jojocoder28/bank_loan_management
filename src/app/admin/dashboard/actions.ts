"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import Loan from "@/models/loan";

export interface AdminStats {
    totalUsers: number;
    totalMembers: number;
    totalBoardMembers: number;
    pendingLoans: number;
    activeLoans: number;
    totalLoans: number;
}

export async function getAdminStats(): Promise<AdminStats> {
    await dbConnect();

    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalMembers = await User.countDocuments({ role: 'member' });
    const totalBoardMembers = await User.countDocuments({ role: 'board_member' });
    
    const pendingLoans = await Loan.countDocuments({ status: 'pending' });
    const activeLoans = await Loan.countDocuments({ status: 'active' });
    const totalLoans = await Loan.countDocuments({});

    return {
        totalUsers,
        totalMembers,
        totalBoardMembers,
        pendingLoans,
        activeLoans,
        totalLoans
    };
}
