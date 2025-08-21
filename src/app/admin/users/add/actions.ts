
"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const addUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["admin", "board_member", "member"]),
});

export async function addUser(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = addUserSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password, role } = validatedFields.data;

  try {
    await dbConnect();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { error: { form: "An account with this email already exists." } };
    }

    await User.create({
      name,
      email,
      password,
      role,
    });

  } catch (error) {
    console.error("Add User Error:", error);
    if ((error as any).code === 11000) {
      return { error: { form: "An account with this email already exists." } };
    }
    return { error: { form: "An unexpected error occurred. Please try again." } };
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
