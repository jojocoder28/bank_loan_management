
"use server";

import dbConnect from "@/lib/mongodb";
import Loan from "@/models/loan";
import User, { IUser, UserStatus } from "@/models/user";
import { revalidatePath } from "next/cache";

export async function getUsers(status?: UserStatus): Promise<IUser[]> {
    await dbConnect();
    
    const query: Partial<{ status: UserStatus }> = {};
    if (status) {
        query.status = status;
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    return JSON.parse(JSON.stringify(users.map(user => ({
      ...user,
      _id: user._id!.toString(),
    }))));
}


export async function deactivateUser(formData: FormData) {
    const userId = formData.get('userId') as string;

    if (!userId) {
        throw new Error('User ID not provided');
    }

    try {
        await dbConnect();

        // Instead of deleting, update the user's status to 'inactive'.
        await User.findByIdAndUpdate(userId, { status: 'inactive' });
        
        // Note: We are NOT deleting their loans to preserve historical data.

        revalidatePath("/admin/users");
        
    } catch (error) {
        console.error("Error deactivating user:", error);
        // In a real app, you'd want to return an error object
        // to the client to display a toast or message.
        return { error: 'Failed to deactivate user.' };
    }
}
