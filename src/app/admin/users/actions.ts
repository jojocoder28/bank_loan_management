
"use server";

import dbConnect from "@/lib/mongodb";
import Loan from "@/models/loan";
import User, { IUser, UserStatus } from "@/models/user";
import { revalidatePath } from "next/cache";

export async function getUsers(status?: UserStatus): Promise<IUser[]> {
    await dbConnect();
    
    const query: Partial<{ status: UserStatus }> = {};
    if (status && ['active', 'inactive', 'retired'].includes(status)) {
        query.status = status;
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    return JSON.parse(JSON.stringify(users.map(user => ({
      ...user,
      _id: user._id.toString(),
    }))));
}


export async function deactivateUser(formData: FormData) {
    const userId = formData.get('userId') as string;

    if (!userId) {
        return { error: 'User ID not provided' };
    }

    try {
        await dbConnect();

        // Check for active loans
        const activeLoan = await Loan.findOne({ user: userId, status: 'active' });
        if (activeLoan) {
            return { error: 'Cannot deactivate a user with an active loan. The loan must be paid or settled first.' };
        }

        await User.findByIdAndUpdate(userId, { status: 'inactive' });
        
        revalidatePath("/admin/users");
        return { success: true };
        
    } catch (error) {
        console.error("Error deactivating user:", error);
        return { error: 'Failed to deactivate user.' };
    }
}

export async function retireUser(formData: FormData) {
    const userId = formData.get('userId') as string;

    if (!userId) {
        return { error: 'User ID not provided' };
    }

    try {
        await dbConnect();
        
        // Check for active loans
        const activeLoan = await Loan.findOne({ user: userId, status: 'active' });
        if (activeLoan) {
            return { error: 'Cannot retire a user with an active loan. The loan must be paid or settled first.' };
        }

        await User.findByIdAndUpdate(userId, { status: 'retired' });
        
        revalidatePath("/admin/users");
        return { success: true };
        
    } catch (error) {
        console.error("Error retiring user:", error);
        return { error: 'Failed to retire user.' };
    }
}

export async function activateUser(formData: FormData) {
    const userId = formData.get('userId') as string;

    if (!userId) {
        throw new Error('User ID not provided');
    }

    try {
        await dbConnect();

        await User.findByIdAndUpdate(userId, { status: 'active' });
        
        revalidatePath("/admin/users");
        
    } catch (error) {
        console.error("Error activating user:", error);
        return { error: 'Failed to activate user.' };
    }
}

export async function deleteUser(formData: FormData) {
    const userId = formData.get('userId') as string;

    if (!userId) {
        throw new Error('User ID not provided');
    }

    try {
        await dbConnect();

        // Optional: Check if user can be deleted (e.g., no active loans)
        const activeLoan = await Loan.findOne({ user: userId, status: 'active' });
        if (activeLoan) {
            // In a real app, you'd return an error object to the client
            throw new Error('Cannot delete a user with an active loan.');
        }

        await User.findByIdAndDelete(userId);
        
        revalidatePath("/admin/users");
        
    } catch (error) {
        console.error("Error deleting user:", error);
        // In a real app, you'd handle this more gracefully
        throw new Error('Failed to delete user.');
    }
}
