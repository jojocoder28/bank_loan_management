
"use server";

import dbConnect from "@/lib/mongodb";
import { z } from "zod";
import BulkImportData from "@/models/bulkImportData";

const schema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  membershipNumber: z.string().optional(),
  phoneNumber: z.string().min(10, "A valid phone number is required."),
  email: z.string().email("Invalid email format.").optional().or(z.literal('')),
  joinDate: z.coerce.date({ message: "Invalid join date."}),
  personalAddress: z.string().min(1, "Personal address is required."),
  age: z.coerce.number().min(18, "Must be at least 18."),
  gender: z.enum(['male', 'female', 'other']),
  profession: z.string().min(1, "Profession is required."),
  workplace: z.string().min(1, "Workplace is required."),
  workplaceAddress: z.string().min(1, "Workplace address is required."),
  bankAccountNumber: z.string().min(1, "Bank account number is required."),
  nomineeName: z.string().min(1, "Nominee name is required."),
  nomineeRelation: z.string().min(1, "Nominee relation is required."),
  nomineeAge: z.coerce.number().min(1, "Nominee age must be positive."),
});

export async function submitDataEntryForm(prevState: any, formData: FormData) {
  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));
  
  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors, success: false };
  }

  try {
    await dbConnect();

    // Prevent duplicates based on phone number
    const existingEntry = await BulkImportData.findOne({ phoneNumber: validatedFields.data.phoneNumber });
    if (existingEntry) {
        return { error: { form: "An entry with this phone number has already been submitted." }, success: false };
    }

    await BulkImportData.create(validatedFields.data);

    return { error: null, success: true };
  } catch (error: any) {
    console.error("Data Entry Form Error:", error);
     if (error.code === 11000) {
        return { error: { form: "This phone number or email is already in the submission list." }, success: false };
    }
    return { error: { form: "An unexpected error occurred. Please try again." }, success: false };
  }
}
