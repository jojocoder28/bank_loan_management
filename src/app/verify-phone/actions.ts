
'use server';

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";

export async function verifyUserOtp(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    await dbConnect();

    const user = await User.findOne({
      phone: phone,
      phoneOtp: otp,
      phoneOtpExpires: { $gt: new Date() },
    });

    if (!user) {
      return { success: false, message: 'Invalid or expired OTP. Please try again.' };
    }

    user.isVerified = true;
    user.phoneOtp = undefined;
    user.phoneOtpExpires = undefined;
    await user.save();

    return { success: true, message: 'Phone number successfully verified! You will be redirected to the login page shortly.' };

  } catch (error) {
    console.error("Phone verification error:", error);
    return { success: false, message: 'An unexpected error occurred during verification.' };
  }
}
