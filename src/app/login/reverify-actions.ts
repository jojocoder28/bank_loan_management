
"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import twilio from 'twilio';


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
        
        // Send OTP via Twilio
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWilio_AUTH_TOKEN;
        const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !twilioPhoneNumber) {
            console.error("Twilio credentials are not configured in .env file.");
            if (process.env.NODE_ENV === 'production') {
                return { error: "The SMS service is not configured correctly. Please contact an administrator." };
            } else {
                console.log(`====== Re-sent OTP for ${user.name} (${user.phone}) [DEV ONLY] ======`);
                console.log(phoneOtp);
                console.log('======================================================================');
                 return { error: null }; // Success in dev mode
            }
        } else {
             const client = twilio(accountSid, authToken);
             try {
                await client.messages.create({
                    body: `Your new verification code for S&KGPPS Co-op is: ${phoneOtp}`,
                    from: twilioPhoneNumber,
                    to: `+91${user.phone}` // Assuming Indian numbers
                });
                return { error: null }; // Success
             } catch (smsError) {
                 console.error("Twilio SMS Re-sending Error:", smsError);
                 return { error: "Failed to resend verification code. Please try again later." };
             }
        }

    } catch (error: any) {
        console.error("Re-verification OTP Error:", error);
        return { error: "An unexpected server error occurred. Please try again later." };
    }
}
