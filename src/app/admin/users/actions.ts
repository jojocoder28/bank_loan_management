
"use server";

import clientPromise from "@/lib/mongodb";
import { User } from "@/models/user";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || 'coop_bank_db');
}

async function seedAdminUser() {
  try {
    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    const adminExists = await usersCollection.findOne({ role: 'admin' });

    if (!adminExists) {
        console.log("Seeding initial admin user...");
        // Ensure you have ADMIN_PASSWORD in your .env file
        const password = process.env.ADMIN_PASSWORD || "password";
        const hashedPassword = await bcrypt.hash(password, 10);
        await usersCollection.insertOne({
            name: "Admin User",
            email: "admin@cooploan.com",
            password: hashedPassword,
            role: "admin",
            createdAt: new Date(),
        });
        console.log("Admin user seeded successfully.");
    }
  } catch (error) {
      console.error("Failed to seed admin user:", error);
  }
}

export async function getUsers() {
    await seedAdminUser(); // Ensure admin exists before fetching users
    const db = await getDb();
    const users = await db.collection<User>('users').find({}).sort({ createdAt: -1 }).toArray();

    return users.map(user => ({
      ...user,
      _id: user._id!.toString(),
      password: "" // NEVER send password hash to the client
    }));
}
