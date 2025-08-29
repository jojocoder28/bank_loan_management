
"use server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { z } from "zod";
import { redirect } from 'next/navigation';
import twilio from 'twilio';


const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

// Returns an error message string on failure, or null on success.
export async function signUp(formData: FormData): Promise<{ error: string | null; phone?: string | null }> {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = signupSchema.safeParse(values);

  // 1. Validate input
  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors)[0]?.[0];
    return { error: firstError ?? "Invalid data provided." };
  }

  const { name, email, phone, password } = validatedFields.data;

  try {
    await dbConnect();
    
    // 2. Check if user already exists
    const existingUser = await User.findOne({ phone: phone });
    if (existingUser) {
      return { error: "An account with this phone number already exists." };
    }

    const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 3. Create the new user
    const newUser = await User.create({
      name,
      email: email?.toLowerCase(),
      phone,
      password,
      isVerified: false,
      phoneOtp,
      phoneOtpExpires,
    });
    
    // 4. Send OTP via Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
        console.error("Twilio credentials are not configured in .env file.");
        // In development, we can log the OTP to the console.
        // In production, this should return an error.
        if (process.env.NODE_ENV === 'production') {
             return { error: "The SMS service is not configured correctly. Please contact an administrator." };
        } else {
             console.log(`====== OTP for ${newUser.name} (${newUser.phone}) [DEV ONLY] ======`);
             console.log(phoneOtp);
             console.log('================================================================');
        }
    } else {
         const client = twilio(accountSid, authToken);
         try {
            await client.messages.create({
                body: `Your verification code for S&KGPPS Co-op is: ${phoneOtp}`,
                from: twilioPhoneNumber,
                to: `+91${newUser.phone}` // Assuming Indian numbers, add country code
            });
         } catch (smsError) {
             console.error("Twilio SMS Sending Error:", smsError);
             return { error: "Failed to send verification code. Please check the phone number and try again." };
         }
    }


    return { error: null, phone: newUser.phone }; // Success

  } catch (error: any) {
    console.error("Signup Error:", error);
    // This is a fallback for rare cases, like a database connection issue.
    return { error: "An unexpected error occurred during signup. Please try again." };
  }
}
