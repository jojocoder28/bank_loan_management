
'use server';

import { getSession } from '@/lib/session';
import dbConnect from '@/lib/mongodb';
import User, { IUser } from '@/models/user';
import Loan, { ILoan } from '@/models/loan';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export interface FinancesData {
    user: {
        name: string;
        role: IUser['role'];
        shareFund: number;
        guaranteedFund: number;
    };
    allLoans: ILoan[];
}

export async function getMyFinancesData(): Promise<FinancesData | null> {
    const session = await getSession();
    if (!session) {
        return null;
    }

    try {
        await dbConnect();
        const user = await User.findById(session.id).lean();
        if (!user) {
            return null;
        }

        const allLoans = await Loan.find({ user: user._id }).sort({ createdAt: -1 }).lean();

        return {
            user: {
                name: user.name,
                role: user.role,
                shareFund: user.shareFund || 0,
                guaranteedFund: user.guaranteedFund || 0,
            },
            allLoans: JSON.parse(JSON.stringify(allLoans)),
        };

    } catch (error) {
        console.error("Failed to fetch finances data:", error);
        return null;
    }
}


const updatePaymentSchema = z.object({
  loanId: z.string(),
  newMonthlyPayment: z.coerce.number().min(0, "Monthly payment cannot be negative."),
});

export async function requestPaymentChange(prevState: any, formData: FormData): Promise<{ error: string | null, success: boolean }> {
    const session = await getSession();
    if (!session || session.role !== 'member') {
        return { error: 'Unauthorized.', success: false };
    }

    const validatedFields = updatePaymentSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.newMonthlyPayment?.[0] || "Invalid input.", success: false };
    }

    const { loanId, newMonthlyPayment } = validatedFields.data;

    try {
        await dbConnect();

        const loan = await Loan.findOne({ _id: loanId, user: session.id });

        if (!loan) {
            return { error: 'Loan not found or you do not have permission to modify it.', success: false };
        }
        
        if (loan.status !== 'active') {
             return { error: 'You can only change the payment amount for active loans.', success: false };
        }
        
        const now = new Date();
        
        loan.modificationRequests.push({
            type: 'change_payment',
            requestedValue: newMonthlyPayment,
            status: 'pending',
            requestDate: now,
            effectiveMonth: now.getMonth(), // 0-indexed
            effectiveYear: now.getFullYear(),
        } as any);


        await loan.save();

        revalidatePath('/my-finances');
        revalidatePath('/admin/approvals');
        return { error: null, success: true };

    } catch (error) {
        console.error("Update Payment Error:", error);
        return { error: 'An unexpected error occurred.', success: false };
    }
}

const increaseLoanSchema = z.object({
    loanId: z.string(),
    increaseAmount: z.coerce.number().min(1, "Increase amount must be positive."),
});

export async function requestLoanIncrease(prevState: any, formData: FormData): Promise<{ error: string | null; success: boolean }> {
    const session = await getSession();
    if (!session || session.role !== 'member') {
        return { error: 'Unauthorized.', success: false };
    }

    const validatedFields = increaseLoanSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.increaseAmount?.[0] || 'Invalid input.', success: false };
    }
    
    const { loanId, increaseAmount } = validatedFields.data;

    try {
        await dbConnect();

        const loan = await Loan.findOne({ _id: loanId, user: session.id });
        if (!loan) {
            return { error: 'Loan not found or you do not have permission to modify it.', success: false };
        }
        if (loan.status !== 'active') {
            return { error: 'You can only increase the amount for active loans.', success: false };
        }

        loan.modificationRequests.push({
            type: 'increase_amount',
            requestedValue: increaseAmount,
            status: 'pending',
            requestDate: new Date(),
        } as any);

        await loan.save();

        revalidatePath('/my-finances');
        revalidatePath('/admin/approvals');
        return { error: null, success: true };
    } catch (error) {
        console.error('Loan Increase Error:', error);
        return { error: 'An unexpected error occurred.', success: false };
    }
}
