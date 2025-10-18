
'use server';

import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import BulkImportData from '@/models/bulkImportData';
import { revalidatePath } from 'next/cache';

const applicationSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits."),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  
  joinDay: z.coerce.number().min(1).max(31),
  joinMonth: z.coerce.number().min(1).max(12),
  joinYear: z.coerce.number().min(1950).max(new Date().getFullYear()),

  personalAddress: z.string().min(1, 'Personal address is required.'),
  age: z.coerce.number().min(18, 'You must be at least 18 years old.'),
  gender: z.enum(['male', 'female', 'other']),
  workplace: z.string().min(1, 'Workplace is required.'),
  profession: z.string().min(1, 'Profession is required.'),
  workplaceAddress: z.string().min(1, 'Workplace address is required.'),
  bankAccountNumber: z.string().min(1, 'Bank account number is required.'),
  nomineeName: z.string().min(1, 'Nominee name is required.'),
  nomineeRelation: z.string().min(1, 'Nominee relation is required.'),
  nomineeAge: z.coerce.number().min(1, 'Nominee age is required.'),
});


export async function submitPublicData(prevState: any, formData: FormData) {
    const values = Object.fromEntries(formData.entries());
    const validatedFields = applicationSchema.safeParse(values);
    
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    try {
        await dbConnect();
        
        const { joinDay, joinMonth, joinYear, ...restOfData } = validatedFields.data;

        // Construct the date. The month is 0-indexed in JavaScript's Date constructor.
        const joinDate = new Date(joinYear, joinMonth - 1, joinDay);
        if (isNaN(joinDate.getTime())) {
            return { error: { form: "The selected joining date is invalid." } };
        }

        await BulkImportData.create({
            ...restOfData,
            joinDate,
        });

    } catch (error: any) {
        console.error("Public Data Entry Error:", error);
        if (error.code === 11000) {
            if (error.keyPattern?.phoneNumber) {
                return { error: { phoneNumber: ["This phone number is already in use."] } };
            }
            if (error.keyPattern?.email && validatedFields.data.email) {
                 return { error: { email: ["This email address is already in use."] } };
            }
        }
        return { error: { form: 'An unexpected error occurred. Please try again.' } };
    }

    revalidatePath('/admin/data-export');
    return { success: true, error: null }
}
