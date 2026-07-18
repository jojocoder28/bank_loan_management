"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ error?: string; success?: boolean }> {
    if (!token) {
        return { error: "Reset token is missing." };
    }

    if (!newPassword || newPassword.length < 6) {
        return { error: "Password must be at least 6 characters long." };
    }

    try {
        await dbConnect();

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return { error: "Invalid or expired password reset token." };
        }

        user.password = newPassword;
        // Clean up token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        // Save the updated password (the user schema pre-save hook will hash it automatically)
        await user.save();

        return { success: true };
    } catch (error: any) {
        console.error("Failed to reset password:", error);
        return { error: error.message || "Failed to reset password." };
    }
}
