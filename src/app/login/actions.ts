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

  try {
    await dbConnect();

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return { error: 'Invalid email or password.' };
    }
    
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return { error: 'Invalid email or password.' };
    }

    await createSession({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    });

  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred.' };
  }

  redirect('/');
}
