
'use server';

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
// import { sendVerificationEmail } from "../signup/email-actions";
// import crypto from "crypto";


// export async function resendVerificationEmail(email: string): Promise<{ error: string | null }> {
//     if (!email) {
//         return { error: "Email address is required." };
//     }

//     try {
//         await dbConnect();
//         const user = await User.findOne({ email: email.toLowerCase() });

//         if (!user) {
//             // Don't reveal if an email exists or not for security.
//             return { error: "If an account with this email exists, a new verification link will be sent." };
//         }

//         if (user.isVerified) {
//             return { error: "This account has already been verified." };
//         }

//         // Generate a new token and expiration date
//         const verificationToken = crypto.randomBytes(32).toString("hex");
//         const verificationTokenExpires = new Date(Date.now() + 3600 * 1000); // 1 hour from now

//         user.verificationToken = verificationToken;
//         user.verificationTokenExpires = verificationTokenExpires;
//         await user.save();

//         await sendVerificationEmail(user.email, user.name, verificationToken);

//         return { error: null };

//     } catch (error: any) {
//         console.error("Re-verification Error:", error);
//         // Avoid leaking specific error details to the client
//         return { error: "An unexpected server error occurred. Please try again later." };
//     }
// }

export async function resendVerificationOtp(phone: string): Promise<{ error: string | null }> {
    if (!phone) {
        return { error: "Phone number is required." };
    }

    try {
        await dbConnect();
        const user = await User.findOne({ phone });

        if (!user) {
            // Don't reveal if a phone number exists or not for security.
            return { error: "If an account with this phone number exists, a new OTP will be sent." };
        }

        if (user.isVerified) {
            return { error: "This account has already been verified." };
        }

        const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        user.phoneOtp = phoneOtp;
        user.phoneOtpExpires = phoneOtpExpires;
        await user.save();
        
        console.log(`====== OTP for ${user.name} (${user.phone}) ======`);
        console.log(phoneOtp);
        console.log('===================================================');

        return { error: null };

    } catch (error: any) {
        console.error("Re-verification OTP Error:", error);
        return { error: "An unexpected server error occurred. Please try again later." };
    }
}
