
"use server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { z } from "zod";
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
export async function signUp(formData: FormData): Promise<{ error: string | null; success?: boolean }> {
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

    // 3. Create the new user
    await User.create({
      name,
      // If email is an empty string, set it to null to avoid unique index conflicts.
      email: email ? email.toLowerCase() : null,
      phone,
      password,
      isVerified: true, // User is verified immediately
    });
    
    return { error: null, success: true }; // Success

  } catch (error: any) {
    console.error("Signup Error:", error);
    // This is a fallback for rare cases, like a database connection issue.
    return { error: "An unexpected error occurred during signup. Please try again." };
  }
}
