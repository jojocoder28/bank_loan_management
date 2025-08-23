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

export async function login(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid email or password.' };
  }

  const { email, password } = validatedFields.data;

  let user;
  try {
    await dbConnect();

    const foundUser = await User.findOne({ email }).select('+password photoUrl membershipApplied');
    if (!foundUser) {
      return { error: 'Invalid email or password.' };
    }
    
    const isPasswordCorrect = await foundUser.comparePassword(password);
    if (!isPasswordCorrect) {
      return { error: 'Invalid email or password.' };
    }
    
    // Assign found user to the outer scope variable
    user = foundUser;

  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred.' };
  }
  
  // Create session and redirect outside the try...catch block
  await createSession({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    photoUrl: user.photoUrl,
    membershipApplied: user.membershipApplied
  });

  if (user.role === 'admin') {
    redirect('/admin/dashboard');
  }

  redirect('/dashboard');
}
