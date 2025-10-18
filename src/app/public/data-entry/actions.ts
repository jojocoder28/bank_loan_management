
"use server";

import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import BulkImportData from "@/models/bulkImportData";
import { revalidatePath } from "next/cache";

const dataEntrySchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  membershipNumber: z.string().optional(),
  phoneNumber: z.string().min(10, "A valid 10-digit phone number is required.").max(15),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  joinDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "A valid join date is required.",
  }),
  personalAddress: z.string().min(5, "Personal address is required."),
  age: z.coerce.number().min(18, "You must be at least 18 years old."),
  gender: z.enum(['male', 'female', 'other'], { required_error: "Please select a gender." }),
  profession: z.string().min(2, "Profession is required."),
  workplace: z.string().min(2, "Workplace is required."),
  workplaceAddress: z.string().min(5, "Workplace address is required."),
  bankAccountNumber: z.string().min(5, "Bank account number is required."),
  nomineeName: z.string().min(2, "Nominee's name is required."),
  nomineeRelation: z.string().min(2, "Relation to nominee is required."),
  nomineeAge: z.coerce.number().min(1, "Nominee's age must be at least 1."),
});

export async function submitDataEntryForm(prevState: any, formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const validatedFields = dataEntrySchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      success: false
    };
  }

  try {
    await dbConnect();

    // Check for duplicate phone number
    const existingEntry = await BulkImportData.findOne({ phoneNumber: validatedFields.data.phoneNumber });
    if (existingEntry) {
        return {
            error: { form: "A submission with this phone number already exists." },
            success: false
        }
    }

    await BulkImportData.create({
        ...validatedFields.data,
        joinDate: new Date(validatedFields.data.joinDate)
    });

    revalidatePath("/admin/data-export");

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Data Entry Submission Error:", error);
    if (error.code === 11000) {
        if(error.keyPattern?.phoneNumber) {
            return { error: { form: "A submission with this phone number already exists." }, success: false };
        }
        if(error.keyPattern?.email) {
             return { error: { form: "A submission with this email address already exists." }, success: false };
        }
    }
    return {
      error: { form: "An unexpected error occurred. Please try again." },
      success: false
    };
  }
}
