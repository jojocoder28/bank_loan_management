
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
  role: z.enum(["admin", "board_member", "member", "user"]),
  // Optional Fields
  workplace: z.string().optional(),
  profession: z.string().optional(),
  workplaceAddress: z.string().optional(),
  personalAddress: z.string().optional(),
  membershipNumber: z.string().optional(),
  phone: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  age: z.coerce.number().optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  nomineeName: z.string().optional(),
  nomineeRelation: z.string().optional(),
  nomineeAge: z.coerce.number().optional(),
  shareFund: z.coerce.number().optional(),
  guaranteedFund: z.coerce.number().optional()
});

export async function addUser(prevState: any, formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = addUserSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password, role, membershipNumber, ...otherDetails } = validatedFields.data;

  try {
    await dbConnect();

    // 1. Check for existing email
    const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingUserByEmail) {
      return { error: { form: "An account with this email already exists." } };
    }
    
    // 2. Check for existing membership number if provided
    if (membershipNumber) {
        const existingUserByMembership = await User.findOne({ membershipNumber });
        if (existingUserByMembership) {
            return { error: { membershipNumber: ["This membership number is already assigned."]}};
        }
    }

    // 3. Build the user data object
    const userData: any = {
      name,
      email: email.toLowerCase(),
      password, // Password will be hashed by the pre-save hook in the User model
      role,
    };
    
    if (membershipNumber) {
        userData.membershipNumber = membershipNumber;
    }

    // Add other optional fields only if they have a value
    for (const [key, value] of Object.entries(otherDetails)) {
        if (value !== undefined && value !== null && value !== '') {
            userData[key] = value;
        }
    }

    // 4. Create the user
    await User.create(userData);

  } catch (error: any) {
    console.error("Add User Error:", error);
    // Handle potential race condition duplicate key errors from the database
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      if (field === 'email') {
        return { error: { form: "An account with this email already exists." } };
      }
      if (field === 'membershipNumber') {
          return { error: { membershipNumber: ["This membership number is already assigned."] } };
      }
    }
    return { error: { form: "An unexpected error occurred. Please try again." } };
  }

  // 5. Revalidate and redirect on success
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
