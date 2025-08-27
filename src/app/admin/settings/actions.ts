
"use server";

import dbConnect from "@/lib/mongodb";
import Bank, { IBank } from "@/models/bank";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Gets the bank settings document.
 * If it doesn't exist, it creates one with default values.
 * This ensures there is always a single settings document.
 */
export async function getBankSettings(): Promise<IBank> {
    await dbConnect();
    let settings = await Bank.findOne({ singleton: 'bank-settings' });

    if (!settings) {
        // Create the document if it doesn't exist
        settings = await Bank.create({
            loanInterestRate: 10,
            thriftFundInterestRate: 6,
        });
    }
    return JSON.parse(JSON.stringify(settings));
}

const settingsSchema = z.object({
  loanInterestRate: z.coerce.number().min(0, "Loan interest rate must be non-negative."),
  thriftFundInterestRate: z.coerce.number().min(0, "Thrift fund interest rate must be non-negative."),
});


export async function updateBankSettings(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return { error: "Unauthorized access." };
    }
    
    const validatedFields = settingsSchema.safeParse({
        loanInterestRate: formData.get("loanInterestRate"),
        thriftFundInterestRate: formData.get("thriftFundInterestRate"),
    });

    if (!validatedFields.success) {
        return {
          error: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    try {
        await dbConnect();
        const settings = await Bank.findOneAndUpdate(
            { singleton: 'bank-settings' },
            { $set: validatedFields.data },
            { new: true, upsert: true } // upsert ensures it's created if it doesn't exist
        );

    } catch (error) {
         console.error("Update Bank Settings Error:", error);
         return { error: "An unexpected error occurred while updating settings." };
    }

    revalidatePath("/admin/settings");
    revalidatePath("/apply-loan"); // Revalidate where the rates are used
    
    return { error: null, success: "Bank settings updated successfully." };
}
