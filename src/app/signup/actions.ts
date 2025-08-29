
"use server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { z } from "zod";
// import crypto from "crypto";
// import { sendVerificationEmail } from "./email-actions";
import { redirect } from 'next/navigation';


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
    
    // 2. Check if user already exists (case-insensitive email)
    const existingUser = await User.findOne({ phone: phone });
    if (existingUser) {
      return { error: "An account with this phone number already exists." };
    }

    // const verificationToken = crypto.randomBytes(32).toString("hex");
    // const verificationTokenExpires = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    const phoneOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 3. Create the new user
    // The pre-save hook in the User model will hash the password automatically.
    // The default role 'user' will also be assigned by the model.
    const newUser = await User.create({
      name,
      email: email?.toLowerCase(),
      phone,
      password,
      isVerified: false,
      // verificationToken,
      // verificationTokenExpires,
      phoneOtp,
      phoneOtpExpires,
    });
    
    // In a real app, you would send the OTP via an SMS gateway like Twilio.
    // For this simulation, we will log it to the console.
    console.log(`====== OTP for ${newUser.name} (${newUser.phone}) ======`);
    console.log(phoneOtp);
    console.log('===================================================');


    // 4. Send verification email
    // await sendVerificationEmail(email, name, verificationToken);


    return { error: null, phone: newUser.phone }; // Success

  } catch (error: any) {
    console.error("Signup Error:", error);
    // This is a fallback for rare cases, like a database connection issue.
    return { error: "An unexpected error occurred during signup. Please try again." };
  }
}
