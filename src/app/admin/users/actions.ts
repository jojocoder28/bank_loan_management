
"use server";

import dbConnect from "@/lib/mongodb";
import Loan from "@/models/loan";
import User, { IUser } from "@/models/user";
import { revalidatePath } from "next/cache";

export async function getUsers(): Promise<IUser[]> {
    await dbConnect();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();

    return JSON.parse(JSON.stringify(users.map(user => ({
      ...user,
      _id: user._id!.toString(),
    }))));
}


export async function deleteUser(formData: FormData) {
    const userId = formData.get('userId') as string;

    if (!userId) {
        throw new Error('User ID not provided');
    }

    try {
        await dbConnect();

        // Also delete all loans associated with this user
        await Loan.deleteMany({ user: userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        revalidatePath("/admin/users");
        
    } catch (error) {
        console.error("Error deleting user:", error);
        // In a real app, you'd want to return an error object
        // to the client to display a toast or message.
        return { error: 'Failed to delete user.' };
    }
}
