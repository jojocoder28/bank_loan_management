
'use server';

import { getSession } from "@/lib/session";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const applicationSchema = z.object({
  personalAddress: z.string().min(1, 'Personal address is required.'),
  phone: z.string().min(1, 'Phone number is required.'),
  age: z.coerce.number().min(18, 'You must be at least 18 years old.'),
  gender: z.enum(['male', 'female', 'other']),
  workplace: z.string().min(1, 'Workplace is required.'),
  profession: z.string().min(1, 'Profession is required.'),
  workplaceAddress: z.string().min(1, 'Workplace address is required.'),
  bankAccountNumber: z.string().min(1, 'Bank account number is required.'),
  nomineeName: z.string().min(1, 'Nominee name is required.'),
  nomineeRelation: z.string().min(1, 'Nominee relation is required.'),
  nomineeAge: z.coerce.number().min(1, 'Nominee age is required.'),
});


export async function applyForMembership(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session) {
        return { error: 'You must be logged in to apply.' }
    }
    
    const values = Object.fromEntries(formData.entries());
    const validatedFields = applicationSchema.safeParse(values);
    
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    await dbConnect();
    const user = await User.findById(session.id);
    if (!user) {
         return { error: 'Could not find your user profile.' }
    }

    if (user.role !== 'user') {
        return { error: `You cannot apply. Your current role is already '${user.role}'.` }
    }
    
    if (user.membershipApplied) {
        return { error: `Your application is already pending approval.` }
    }

    // Update user with all the new details
    Object.assign(user, validatedFields.data);

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
