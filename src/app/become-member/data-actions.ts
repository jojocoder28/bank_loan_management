
"use server";

import { getSession } from "@/lib/session";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";

interface MembershipStatus {
    membershipApplied: boolean;
}

export async function getMembershipStatus(): Promise<MembershipStatus> {
    const session = await getSession();
    if (!session) {
        return { membershipApplied: false };
    }

    try {
        await dbConnect();
        const user = await User.findById(session.id).select('membershipApplied').lean();
        if (!user) {
            return { membershipApplied: false };
        }
        return {
            membershipApplied: user.membershipApplied || false,
        };
    } catch (error) {
        console.error("Failed to get membership status:", error);
        return { membershipApplied: false };
    }
}
