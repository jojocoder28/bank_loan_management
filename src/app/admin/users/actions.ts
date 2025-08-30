
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
