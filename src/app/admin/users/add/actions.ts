
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
  // Optional Fields
  workplace: z.string().optional().or(z.literal('')),
  profession: z.string().optional().or(z.literal('')),
  workplaceAddress: z.string().optional().or(z.literal('')),
  personalAddress: z.string().optional().or(z.literal('')),
  membershipNumber: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  bankAccountNumber: z.string().optional().or(z.literal('')),
  age: z.coerce.number().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  nomineeName: z.string().optional().or(z.literal('')),
  nomineeRelation: z.string().optional().or(z.literal('')),
  nomineeAge: z.coerce.number().optional(),
});

export async function addUser(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = addUserSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password, role, ...otherDetails } = validatedFields.data;

  try {
    await dbConnect();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { error: { form: "An account with this email already exists." } };
    }
    
    if (otherDetails.membershipNumber) {
        const existingMemberNumber = await User.findOne({ membershipNumber: otherDetails.membershipNumber });
        if (existingMemberNumber) {
            return { error: { form: "This membership number is already assigned to another user."}};
        }
    }


    await User.create({
      name,
      email,
      password,
      role,
      ...otherDetails
    });

  } catch (error: any) {
    console.error("Add User Error:", error);
    if (error.code === 11000) {
      // This can be triggered by either email or membershipNumber
      const field = Object.keys(error.keyValue)[0];
      if (field === 'email') {
        return { error: { form: "An account with this email already exists." } };
      }
      if (field === 'membershipNumber') {
          return { error: { form: "This membership number is already assigned to another user." } };
      }
    }
    return { error: { form: "An unexpected error occurred. Please try again." } };
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
