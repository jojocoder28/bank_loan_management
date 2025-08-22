
'use server';

import { getSession } from "@/lib/session";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { revalidatePath } from "next/cache";

export async function applyForMembership() {
    const session = await getSession();
    if (!session) {
        return { error: 'You must be logged in to apply.' }
    }

    await dbConnect();
    const user = await User.findById(session.id);
    if (!user) {
         return { error: 'Could not find your user profile.' }
    }

    if (user.membershipStatus !== 'provisional') {
        return { error: `You cannot apply. Your current status is: ${user.membershipStatus}` }
    }

    // This is a simplified process. In a real-world scenario, this would
    // likely redirect to a payment gateway to handle the initial deposit.
    // For now, we'll assume the user has made the payment offline and we
    // just update their status to pending.
    user.membershipStatus = 'pending';
    // For the demo, we'll auto-credit the initial amount.
    user.shareFund = (user.shareFund || 0) + 5000;
    
    await user.save();

    revalidatePath('/apply-loan');
    revalidatePath('/admin/approvals');

    return { success: true, error: null }
}
