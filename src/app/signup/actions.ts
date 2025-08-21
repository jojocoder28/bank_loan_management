
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

  if (!validatedFields.success) {
    // Return the first error message.
    return { error: validatedFields.error.errors[0]?.message ?? "Invalid data provided." };
  }

  const { name, email, password } = validatedFields.data;

  try {
    await dbConnect();
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    await User.create({
      name,
      email,
      password, // The pre-save hook in the model will hash this
      role: "member",
    });

    return { error: null }; // Success
  } catch (error) {
    console.error("Signup Error:", error);
    // Check for Mongoose duplicate key error
    if ((error as any).code === 11000) {
        return { error: "An account with this email already exists." };
    }
    return { error: "An unexpected error occurred. Please try again later." };
  }
}
