
'use server';

import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import { createSession } from '@/lib/session';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

type LoginResult = { 
    error: string | null; 
    role?: 'admin' | 'user' | 'member' | 'board_member' | null;
    isUnverified?: boolean;
}

// Return type updated to send role or error
export async function login(formData: FormData): Promise<LoginResult> {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid email or password.' };
  }

  const { email, password } = validatedFields.data;

  let user;
  try {
    await dbConnect();

    const foundUser = await User.findOne({ email: email.toLowerCase() }).select('+password +photoUrl +membershipApplied +name +email +role +isVerified');
    if (!foundUser) {
      return { error: 'Invalid email or password.' };
    }
    
    const isPasswordCorrect = await foundUser.comparePassword(password);
    if (!isPasswordCorrect) {
      return { error: 'Invalid email or password.' };
    }
    
    if (!foundUser.isVerified) {
        return { error: 'Please verify your email address before logging in.', isUnverified: true };
    }

    user = foundUser;

  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred.' };
  }
  
  await createSession({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    photoUrl: user.photoUrl,
    membershipApplied: user.membershipApplied
  });

  // Return role instead of redirecting
  return { error: null, role: user.role };
}
