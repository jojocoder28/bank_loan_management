
"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { revalidatePath } from "next/cache";

async function seedAdminUser() {
  try {
    await dbConnect();
    const adminExists = await User.findOne({ email: 'admin@cooploan.com' });

    if (!adminExists) {
        console.log("Seeding initial admin user...");
        const password = process.env.ADMIN_PASSWORD || "password";
        await User.create({
            name: "Admin User",
            email: "admin@cooploan.com",
            password: password, // The pre-save hook will hash it
            role: "admin",
        });
        console.log("Admin user seeded successfully.");
    }
  } catch (error) {
      console.error("Failed to seed admin user:", error);
  }
}

export async function getUsers() {
    await dbConnect();
    // The seedAdminUser function has been removed from here to prevent automatic user creation.
    // If you need to create the first admin, you can do it via a separate script or manually.
    const users = await User.find({}).sort({ createdAt: -1 }).lean();

    return users.map(user => ({
      ...user,
      _id: user._id!.toString(),
      password: "" // NEVER send password hash to the client
    }));
}
