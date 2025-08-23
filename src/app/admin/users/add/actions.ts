
"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/user";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Redefined schema with only the necessary fields for adding an admin.
const addUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  // Role is now hardcoded to 'admin' and removed from schema.
});

export async function addUser(prevState: any, formData: FormData) {
    const values = Object.fromEntries(formData.entries());
    
    // 1. Validate the form data
    const validatedFields = addUserSchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const { name, email, password } = validatedFields.data;

    try {
        await dbConnect();

        // 2. Check for duplicate email
        const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingUserByEmail) {
            return { error: { email: ["An account with this email already exists."] } };
        }
        
        // 3. Build the user data object for creation
        const userData: any = {
            name,
            email: email.toLowerCase(),
            password, // The pre-save hook will hash this
            role: 'admin', // Hardcode the role to admin
        };

        // 4. Create the user in the database
        await User.create(userData);

    } catch (error: any) {
        console.error("Add User Error:", error);
        // Specific check for MongoDB duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            if (field === 'email') {
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
