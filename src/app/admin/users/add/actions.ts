
"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Redefined schema with only the necessary fields as required.
const addUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["admin", "board_member", "member", "user"]),
  // All other fields are optional.
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
    
    // 1. Validate the form data
    const validatedFields = addUserSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const { name, email, password, role, ...optionalFields } = validatedFields.data;

    try {
        await dbConnect();

        // 2. Check for duplicate email
        const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingUserByEmail) {
            return { error: { email: ["An account with this email already exists."] } };
        }
        
        // 3. Check for duplicate membership number only if it's provided
        if (optionalFields.membershipNumber) {
            const existingUserByMembership = await User.findOne({ membershipNumber: optionalFields.membershipNumber });
            if (existingUserByMembership) {
                return { error: { membershipNumber: ["This membership number is already assigned."]}};
            }
        }

        // 4. Build the user data object for creation
        const userData: any = {
            name,
            email: email.toLowerCase(),
            password, // The pre-save hook will hash this
            role,
        };

        // Add optional fields to the user data object only if they have a value
        for (const [key, value] of Object.entries(optionalFields)) {
            if (value !== undefined && value !== null && value !== '') {
                userData[key] = value;
            }
        }

        // 5. Create the user in the database
        await User.create(userData);

    } catch (error: any) {
        console.error("Add User Error:", error);
        // Specific check for MongoDB duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            if (field === 'email') {
                return { error: { email: ["An account with this email already exists."] } };
            }
            if (field === 'membershipNumber') {
                return { error: { membershipNumber: ["This membership number is already assigned."] } };
            }
        }
        // Fallback for any other unexpected database errors
        return { error: { form: "An unexpected error occurred. Please try again." } };
    }

    // 6. Redirect on success
    revalidatePath("/admin/users");
    redirect("/admin/users");
}
