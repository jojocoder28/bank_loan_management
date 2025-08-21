
"use server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

async function getDb() {
  const client = await clientPromise;
  return client.db();
}

export async function signUp(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = signupSchema.safeParse(values);

  if (!validatedFields.success) {
    return validatedFields.error.flatten().fieldErrors.password?.[0] 
        || validatedFields.error.flatten().fieldErrors.email?.[0]
        || validatedFields.error.flatten().fieldErrors.name?.[0];
  }

  const { name, email, password } = validatedFields.data;

  try {
    const db = await getDb();
    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return "An account with this email already exists.";
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      role: "member", // Default role
      createdAt: new Date(),
    });

    return null;
  } catch (error) {
    console.error("Signup error:", error);
    return "An unexpected error occurred.";
  }
}
