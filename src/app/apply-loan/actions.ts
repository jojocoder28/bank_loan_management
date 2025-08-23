
'use server';

import { z } from 'zod';
import { getSession } from '@/lib/session';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import Loan from '@/models/loan';
import { calculateRequiredFunds } from '@/lib/coop-calculations';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const applyLoanSchema = z.object({
  loanAmount: z.coerce.number().min(10000, 'Minimum loan amount is Rs. 10,000.'),
  monthlyPrincipal: z.coerce.number().min(1000, 'Minimum principal payment is Rs. 1,000.'),
});

export async function applyForLoan(formData: FormData) {
  const userSession = await getSession();
  if (!userSession) {
    return { error: 'You must be logged in to apply for a loan.' };
  }

  const values = Object.fromEntries(formData.entries());
  const validatedFields = applyLoanSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors.loanAmount?.[0] };
  }

  const { loanAmount } = validatedFields.data;

  try {
    await dbConnect();
    const user = await User.findById(userSession.id);

    if (!user) {
      return { error: 'Could not find your user profile.' };
    }

    if (user.role !== 'member') {
        return { error: 'You must be a member to apply for a loan.' };
    }

    // Check for existing loans
    const existingActiveLoan = await Loan.findOne({ user: user._id, status: 'active' });
    if (existingActiveLoan) {
        return { error: 'You already have an active loan. You cannot apply for a new one until it is paid off.' };
    }
    const existingPendingLoan = await Loan.findOne({ user: user._id, status: 'pending' });
    if (existingPendingLoan) {
        return { error: 'You already have a loan application pending approval. Please wait for it to be processed.' };
    }

    // Calculate required funds and any shortfall
    const { requiredShare, requiredGuaranteed } = calculateRequiredFunds(loanAmount);
    const userShareFund = user.shareFund || 0;
    const userGuaranteedFund = user.guaranteedFund || 0;
    
    const shareFundShortfall = Math.max(0, requiredShare - userShareFund);
    const guaranteedFundShortfall = Math.max(0, requiredGuaranteed - userGuaranteedFund);
    const totalShortfall = shareFundShortfall + guaranteedFundShortfall;

    // The actual loan amount to be disbursed, including any shortfall
    const finalLoanAmount = loanAmount + totalShortfall;

    // Update user's funds with the shortfall amount
    if (totalShortfall > 0) {
        user.shareFund = userShareFund + shareFundShortfall;
        user.guaranteedFund = userGuaranteedFund + guaranteedFundShortfall;
        await user.save();
    }
    
    await Loan.create({
      user: user._id,
      loanAmount: finalLoanAmount,
      principal: finalLoanAmount, // Initially, outstanding principal is the full adjusted amount
      interestRate: 10, // Hardcoded 10% annual interest rate
      issueDate: new Date(), // This will be updated upon approval
      status: 'pending',
      payments: [],
    });

  } catch (error) {
    console.error('Loan Application Error:', error);
    return { error: 'An unexpected error occurred while submitting your application.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/admin/approvals');
  redirect('/dashboard');
}
