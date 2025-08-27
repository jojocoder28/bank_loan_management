
'use server';

import { z } from 'zod';
import { getSession } from '@/lib/session';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import Loan from '@/models/loan';
import { calculateRequiredFunds } from '@/lib/coop-calculations';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { calculateLoanTenure } from '@/lib/calculations';

const applyLoanSchema = z.object({
  loanAmount: z.coerce.number().min(10000, 'Minimum loan amount is Rs. 10,000.'),
  monthlyPrincipal: z.coerce.number().min(1000, 'Minimum principal payment is Rs. 1,000.'),
});

export async function applyForLoan(prevState: any, formData: FormData) {
  const userSession = await getSession();
  if (!userSession) {
    return { error: 'You must be logged in to apply for a loan.' };
  }

  const values = Object.fromEntries(formData.entries());
  const validatedFields = applyLoanSchema.safeParse(values);

  if (!validatedFields.success) {
    const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
    return { error: firstError || 'Invalid input.' };
  }

  const { loanAmount, monthlyPrincipal } = validatedFields.data;
  const interestRate = 10; // 10% annual interest

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

    // Based on the requirement, the tenure is simply the total amount divided by the fixed monthly principal payment.
    const tenureMonths = Math.ceil(finalLoanAmount / monthlyPrincipal);

    await Loan.create({
      user: user._id,
      loanAmount: finalLoanAmount,
      principal: finalLoanAmount, 
      interestRate,
      status: 'pending',
      payments: [],
      monthlyPrincipalPayment: monthlyPrincipal,
      loanTenureMonths: tenureMonths, // Use the correctly calculated tenure
      fundShortfall: {
          share: shareFundShortfall,
          guaranteed: guaranteedFundShortfall
      }
    });

  } catch (error) {
    console.error('Loan Application Error:', error);
    return { error: 'An unexpected error occurred while submitting your application.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/admin/approvals');
  redirect('/dashboard');
}
