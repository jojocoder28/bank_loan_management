
"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Redefined schema with only the necessary fields for adding an admin.
const addUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // path of error
});

export async function addUser(prevState: any, formData: FormData) {
    const values = Object.fromEntries(formData.entries());
    
    // 1. Validate the form data
    const validatedFields = addUserSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const { name, email, phone, password } = validatedFields.data;

    try {
        await dbConnect();

        // 2. Check for duplicate phone
        const existingUserByPhone = await User.findOne({ phone });
        if (existingUserByPhone) {
            return { error: { phone: ["An account with this phone number already exists."] } };
        }
        
        // 3. Build the user data object for creation
        const userData: any = {
            name,
            email: email?.toLowerCase(),
            phone,
            password, // The pre-save hook will hash this
            role: 'admin', // Hardcode the role to admin
            isVerified: true, // Admins created by admins are verified by default
        };

        // 4. Create the user in the database
        await User.create(userData);

    } catch (error: any) {
        console.error("Add User Error:", error);
        // Specific check for MongoDB duplicate key errors
        if (error.code === 11000) {
             if (error.keyPattern?.phone) {
                return { error: { phone: ["An account with this phone number already exists."] } };
            }
             if (error.keyPattern?.email && email) {
                return { error: { email: ["An account with this email already exists."] } };
            }
        }
        // Fallback for any other unexpected database errors
        return { error: { form: "An unexpected error occurred. Please try again." } };
    }

    // 5. Redirect on success
    revalidatePath("/admin/users");
    redirect("/admin/users");
}
