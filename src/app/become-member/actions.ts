
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

    // A user can only apply if their role is 'user'.
    // If they are already a member, admin, etc., they cannot re-apply.
    if (user.role !== 'user') {
        return { error: `You cannot apply. Your current role is already '${user.role}'.` }
    }
    
    if (user.membershipApplied) {
        return { error: `Your application is already pending approval.` }
    }

    // This is a simplified process. In a real-world scenario, this would
    // likely redirect to a payment gateway to handle the initial deposit.
    // For now, we'll assume the user has made the payment offline and we
    // just update their status to pending.
    user.membershipApplied = true;
    // For the demo, we'll auto-credit the initial amount.
    user.shareFund = (user.shareFund || 0) + 5000;
    
    await user.save();

    revalidatePath('/become-member');
    revalidatePath('/admin/approvals');

    return { success: true, error: null }
}
