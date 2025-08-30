
'use server';

import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import { createSession } from '@/lib/session';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginResult = { 
    error: string | null; 
    role?: 'admin' | 'user' | 'member' | 'board_member' | null;
}

// Return type updated to send role or error
export async function login(formData: FormData): Promise<LoginResult> {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid email/phone or password.' };
  }

  const { identifier, password } = validatedFields.data;

  let user;
  try {
    await dbConnect();

    const isEmail = identifier.includes('@');
    const query = isEmail ? { email: identifier.toLowerCase() } : { phone: identifier };

    const foundUser = await User.findOne(query).select('+password +photoUrl +membershipApplied +name +email +role +isVerified +phone');
    if (!foundUser) {
      return { error: 'Invalid email/phone or password.' };
    }

    if (foundUser.status === 'inactive') {
        return { error: 'This account has been deactivated. Please contact an administrator.' };
    }
    
    const isPasswordCorrect = await foundUser.comparePassword(password);
    if (!isPasswordCorrect) {
      return { error: 'Invalid email/phone or password.' };
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
