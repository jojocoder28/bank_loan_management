"use server";

import dbConnect from "@/lib/mongodb";
import BulkImportData from "@/models/bulkImportData";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const dataEntrySchema = z.object({
  fullName: z.string().min(2, "Full Name must be at least 2 characters."),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits."),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  personalAddress: z.string().min(1, 'Personal address is required.'),
  age: z.coerce.number().min(18, 'You must be at least 18 years old.'),
  gender: z.enum(['male', 'female', 'other']),
  membershipNumber: z.string().min(1, 'Membership number is required.'),
  joinDate: z.string().min(1, 'Joining date is required.'),
  workplace: z.string().min(1, 'Workplace is required.'),
  profession: z.string().min(1, 'Profession is required.'),
  workplaceAddress: z.string().min(1, 'Workplace address is required.'),
  bankAccountNumber: z.string().min(1, 'Bank account number is required.'),
  nomineeName: z.string().min(1, 'Nominee name is required.'),
  nomineeRelation: z.string().min(1, 'Nominee relation is required.'),
  nomineeAge: z.coerce.number().min(1, 'Nominee age is required.'),
});


export async function submitDataEntryForm(prevState: any, formData: FormData) {
    const values = Object.fromEntries(formData.entries());
    
    const validatedFields = dataEntrySchema.safeParse(values);
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    const {
        fullName,
        phoneNumber,
        email,
        personalAddress,
        age,
        gender,
        membershipNumber,
        joinDate,
        workplace,
        profession,
        workplaceAddress,
        bankAccountNumber,
        nomineeName,
        nomineeRelation,
        nomineeAge
    } = validatedFields.data;

    try {
        await dbConnect();
        
        const existingByPhone = await BulkImportData.findOne({ phoneNumber });
        if (existingByPhone) {
            return { error: { phoneNumber: ["An entry with this phone number already exists."] } };
        }
        
        const existingByMembership = await BulkImportData.findOne({ membershipNumber });
        if (existingByMembership) {
            return { error: { membershipNumber: ["An entry with this membership number already exists."] } };
        }

        if (email) {
            const existingByEmail = await BulkImportData.findOne({ email });
            if (existingByEmail) {
                return { error: { email: ["An entry with this email address already exists."] } };
            }
        }

        await BulkImportData.create({
            fullName,
            phoneNumber,
            email: email || null,
            personalAddress,
            age,
            gender,
            membershipNumber,
            joinDate: new Date(joinDate),
            workplace,
            profession,
            workplaceAddress,
            bankAccountNumber,
            nomineeName,
            nomineeRelation,
            nomineeAge,
            isExported: false, // Always new
        });

    } catch (error: any) {
        console.error("Data Entry Error:", error);
        if (error.code === 11000) {
            return { error: { form: "A record with one of these unique fields (Phone, Email, Membership #) already exists." } };
        }
        return { error: { form: "An unexpected error occurred. Please try again." } };
    }

    revalidatePath("/admin/data-export");
    return { success: true, error: null };
}
