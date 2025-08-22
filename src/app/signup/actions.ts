
"use server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

// Returns an error message string on failure, or null on success.
export async function signUp(formData: FormData): Promise<{ error: string | null }> {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = signupSchema.safeParse(values);

  // 1. Validate input
  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0]?.message ?? "Invalid data provided." };
  }

  const { name, email, password } = validatedFields.data;

  try {
    await dbConnect();
    
    // 2. Check if user already exists (case-insensitive email)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    // 3. Create the new user
    // The pre-save hook in the User model will hash the password automatically.
    // The default role 'user' will also be assigned by the model.
    await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    return { error: null }; // Success

  } catch (error: any) {
    console.error("Signup Error:", error);
    // This is a fallback for rare cases, like a database connection issue.
    return { error: "An unexpected error occurred during signup. Please try again." };
  }
}
