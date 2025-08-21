"use server";

import clientPromise from "@/lib/mongodb";
import { User } from "@/models/user";
import { revalidatePath } from "next/cache";

async function getDb() {
  const client = await clientPromise;
  return client.db();
}

async function seedAdminUser() {
    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    const adminExists = await usersCollection.findOne({ role: 'admin' });

    if (!adminExists) {
        console.log("Seeding initial admin user...");
        await usersCollection.insertOne({
            name: "Admin User",
            email: "admin@cooploan.com",
            role: "admin",
            createdAt: new Date(),
        });
        console.log("Admin user seeded.");
    }
}

export async function getUsers() {
    await seedAdminUser();
    const db = await getDb();
    const users = await db.collection<User>('users').find({}).sort({ createdAt: -1 }).toArray();

    return users.map(user => ({
      ...user,
      _id: user._id!.toString(),
    }));
}
