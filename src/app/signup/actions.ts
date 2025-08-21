
"use server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { z } from "zod";
import { User } from "@/models/user";
import { Db } from "mongodb";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || 'coop_bank_db');
}

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
    const db = await getDb();
    const usersCollection = db.collection<User>("users");
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      role: "member", // Default role
      createdAt: new Date(),
    });

    return { error: null }; // Success
  } catch (error) {
    console.error("Signup Error:", error);
    return { error: "An unexpected error occurred. Please try again later." };
  }
}
