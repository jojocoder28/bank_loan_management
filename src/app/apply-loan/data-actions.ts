
"use server";

import { getSession } from "@/lib/session";
import dbConnect from "@/lib/mongodb";
import User, { UserRole } from "@/models/user";

interface UserData {
    shareFund: number;
    guaranteedFund: number;
    role: UserRole;
}

export async function getUserFundsAndStatus(): Promise<UserData> {
    const session = await getSession();
    if (!session) {
        return { shareFund: 0, guaranteedFund: 0, role: 'user' };
    }

    try {
        await dbConnect();
        const user = await User.findById(session.id).select('shareFund guaranteedFund role').lean();
        if (!user) {
            return { shareFund: 0, guaranteedFund: 0, role: 'user' };
        }
        return {
            shareFund: user.shareFund || 0,
            guaranteedFund: user.guaranteedFund || 0,
            role: user.role || 'user'
        };
    } catch (error) {
        console.error("Failed to get user funds:", error);
        return { shareFund: 0, guaranteedFund: 0, role: 'user' };
    }
}
