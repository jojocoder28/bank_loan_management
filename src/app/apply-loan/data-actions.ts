
"use server";

import { getSession } from "@/lib/session";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";

export async function getUserFunds(): Promise<{ shareFund: number; guaranteedFund: number }> {
    const session = await getSession();
    if (!session) {
        return { shareFund: 0, guaranteedFund: 0 };
    }

    try {
        await dbConnect();
        const user = await User.findById(session.id).select('shareFund guaranteedFund').lean();
        if (!user) {
            return { shareFund: 0, guaranteedFund: 0 };
        }
        return {
            shareFund: user.shareFund || 0,
            guaranteedFund: user.guaranteedFund || 0
        };
    } catch (error) {
        console.error("Failed to get user funds:", error);
        return { shareFund: 0, guaranteedFund: 0 };
    }
}
