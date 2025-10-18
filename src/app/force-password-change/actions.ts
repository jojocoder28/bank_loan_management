
'use server';

import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import { getSession, createSession } from '@/lib/session';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const passwordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});


export async function updatePassword(prevState: any, formData: FormData): Promise<{ error: string | null; success: boolean }> {
    const session = await getSession();
    if (!session) {
        return { error: "You are not logged in.", success: false };
    }
    
    if (!session.requiresPasswordChange) {
        return { error: "You are not required to change your password.", success: false };
    }

    const validatedFields = passwordSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.password?.[0] || validatedFields.error.flatten().fieldErrors.confirmPassword?.[0] || 'Invalid input.', success: false };
    }

    const { password } = validatedFields.data;

    try {
        await dbConnect();

        const userToUpdate = await User.findById(session.id);
        if (!userToUpdate) {
            return { error: "User not found.", success: false };
        }

        userToUpdate.password = password; // The pre-save hook will hash it
        userToUpdate.requiresPasswordChange = false;
        await userToUpdate.save();
        
        // Create a new session with the updated flag
        await createSession({
            ...session,
            requiresPasswordChange: false,
        });

        revalidatePath('/'); // Revalidate all paths

        return { error: null, success: true };

    } catch (e: any) {
        console.error("Password update error:", e);
        return { error: "An unexpected error occurred while updating your password.", success: false };
    }
}
