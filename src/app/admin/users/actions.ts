
"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { revalidatePath } from "next/cache";

export async function getUsers() {
    await dbConnect();
    // The automatic admin seeding has been removed. 
    // The application will now only use users from your database.
    const users = await User.find({}).sort({ createdAt: -1 }).lean();

    return users.map(user => ({
      ...user,
      _id: user._id!.toString(),
      password: "" // NEVER send password hash to the client
    }));
}
