
'use server';

import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import BulkImportData from '@/models/bulkImportData';
import { revalidatePath } from 'next/cache';
import { calculateAge } from '@/lib/calculations';

const applicationSchema = z.object({
  fullName: z.string().min(1, 'Full name is required.'),
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits."),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  
  joinDay: z.coerce.number().min(1).max(31),
  joinMonth: z.coerce.number().min(1).max(12),
  joinYear: z.coerce.number().min(1950).max(new Date().getFullYear()),

  personalAddress: z.string().min(1, 'Personal address is required.'),
  dob: z.preprocess((val) => (val === '' ? null : val), z.coerce.date().nullable().optional()),
  gender: z.enum(['male', 'female', 'other']),
  workplace: z.string().min(1, 'Workplace is required.'),
  profession: z.string().min(1, 'Profession is required.'),
  workplaceAddress: z.string().min(1, 'Workplace address is required.'),
  bankAccountNumber: z.string().min(1, 'Bank account number is required.'),
  nomineeName: z.string().min(1, 'Nominee name is required.'),
  nomineeRelation: z.string().min(1, 'Nominee relation is required.'),
  nomineeDob: z.preprocess((val) => (val === '' ? null : val), z.coerce.date().nullable().optional()),
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

        const dobDate = restOfData.dob ? new Date(restOfData.dob) : null;
        const nomineeDobDate = restOfData.nomineeDob ? new Date(restOfData.nomineeDob) : null;
        const calculatedAge = dobDate ? calculateAge(dobDate) : null;
        const calculatedNomineeAge = nomineeDobDate ? calculateAge(nomineeDobDate) : null;

        await BulkImportData.create({
            ...restOfData,
            age: calculatedAge,
            dob: dobDate,
            nomineeAge: calculatedNomineeAge,
            nomineeDob: nomineeDobDate,
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
