
'use server';

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";

export async function verifyUserToken(token: string): Promise<{ success: boolean; message: string }> {
  try {
    await dbConnect();

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return { success: false, message: 'Invalid or expired verification token. Please try signing up again.' };
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return { success: true, message: 'Email successfully verified! You will be redirected to the login page shortly.' };

  } catch (error) {
    console.error("Email verification error:", error);
    return { success: false, message: 'An unexpected error occurred during verification.' };
  }
}
