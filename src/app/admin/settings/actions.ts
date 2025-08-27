
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
            shareFundDividendRate: 12,
            initialShareFundDeposit: 5000,
            monthlyThriftContribution: 1000,
            maxLoanTenureMonths: 60,
            maxLoanAmount: 600000,
        });
    }
    return JSON.parse(JSON.stringify(settings));
}

const settingsSchema = z.object({
  loanInterestRate: z.coerce.number().min(0, "Loan interest rate must be non-negative."),
  thriftFundInterestRate: z.coerce.number().min(0, "Thrift fund interest rate must be non-negative."),
  shareFundDividendRate: z.coerce.number().min(0, "Dividend rate must be non-negative."),
  initialShareFundDeposit: z.coerce.number().min(0, "Initial deposit must be non-negative."),
  monthlyThriftContribution: z.coerce.number().min(0, "Monthly contribution must be non-negative."),
  maxLoanTenureMonths: z.coerce.number().int().min(1, "Max tenure must be at least 1 month."),
  maxLoanAmount: z.coerce.number().min(10000, "Max loan amount must be at least 10,000."),
});


export async function updateBankSettings(prevState: any, formData: FormData) {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return { error: "Unauthorized access." };
    }
    
    const validatedFields = settingsSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return {
          error: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    try {
        await dbConnect();
        await Bank.findOneAndUpdate(
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
    revalidatePath("/become-member");
    
    return { error: null, success: "Bank settings updated successfully." };
}
