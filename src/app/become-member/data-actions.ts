
"use server";

import { getSession } from "@/lib/session";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";

export interface UserData {
    membershipApplied: boolean;
    email: string | null;
}

export async function getMembershipStatus(): Promise<UserData> {
    const session = await getSession();
    if (!session) {
        return { membershipApplied: false, email: null };
    }

    try {
        await dbConnect();
        const user = await User.findById(session.id).select('membershipApplied email').lean();
        if (!user) {
            return { membershipApplied: false, email: null };
        }
        return {
            membershipApplied: user.membershipApplied || false,
            email: user.email || null,
        };
    } catch (error) {
        console.error("Failed to get membership status:", error);
        return { membershipApplied: false, email: null };
    }
}

    