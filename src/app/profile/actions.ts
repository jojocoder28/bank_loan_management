
"use server";

import dbConnect from "@/lib/mongodb";
import User, { IUser } from "@/models/user";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";

interface UserDetails extends Omit<IUser, 'password' | '_id' | 'createdAt' | 'updatedAt'> {
  _id: string;
  createdAt: string;
}

export async function getProfileData(): Promise<UserDetails | null> {
    try {
        const session = await getSession();
        if (!session) {
            return null;
        }

        await dbConnect();
        const user = await User.findById(session.id).lean();
        if (!user) {
            return null;
        }

        // Sanitize user data
        const { password, ...userWithoutPassword } = user;

        return JSON.parse(JSON.stringify({
            ...userWithoutPassword,
            _id: user._id.toString()
        }));

    } catch (error) {
        console.error("Failed to get profile data:", error);
        return null;
    }
}
