
'use server';

import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import { createSession } from '@/lib/session';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginResult = { 
    error: string | null; 
    role?: 'admin' | 'user' | 'member' | 'board_member' | null;
    isUnverified?: boolean;
    unverifiedPhone?: string;
}

// Return type updated to send role or error
export async function login(formData: FormData): Promise<LoginResult> {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid phone number or password.' };
  }

  const { phone, password } = validatedFields.data;

  let user;
  try {
    await dbConnect();

    const foundUser = await User.findOne({ phone: phone }).select('+password +photoUrl +membershipApplied +name +email +role +isVerified +phone');
    if (!foundUser) {
      return { error: 'Invalid phone number or password.' };
    }
    
    const isPasswordCorrect = await foundUser.comparePassword(password);
    if (!isPasswordCorrect) {
      return { error: 'Invalid phone number or password.' };
    }
    
    if (!foundUser.isVerified) {
        return { error: 'Please verify your phone number before logging in.', isUnverified: true, unverifiedPhone: foundUser.phone };
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
    membershipApplied: user.membershipApplied,
    phone: user.phone,
  });

  // Return role instead of redirecting
  return { error: null, role: user.role };
}
