
"use server";

import { getSession } from "@/lib/session";
import dbConnect from "@/lib/mongodb";
import User, { MembershipStatus } from "@/models/user";

interface UserData {
    shareFund: number;
    guaranteedFund: number;
    membershipStatus: MembershipStatus;
}

export async function getUserFundsAndStatus(): Promise<UserData> {
    const session = await getSession();
    if (!session) {
        return { shareFund: 0, guaranteedFund: 0, membershipStatus: 'provisional' };
    }

    try {
        await dbConnect();
        const user = await User.findById(session.id).select('shareFund guaranteedFund membershipStatus').lean();
        if (!user) {
            return { shareFund: 0, guaranteedFund: 0, membershipStatus: 'provisional' };
        }
        return {
            shareFund: user.shareFund || 0,
            guaranteedFund: user.guaranteedFund || 0,
            membershipStatus: user.membershipStatus || 'provisional'
        };
    } catch (error) {
        console.error("Failed to get user funds:", error);
        return { shareFund: 0, guaranteedFund: 0, membershipStatus: 'provisional' };
    }
}
