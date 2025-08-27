
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
import { getBankSettings } from '../admin/settings/actions';

const applyLoanSchema = z.object({
  loanAmount: z.coerce.number().min(10000, 'Minimum loan amount is Rs. 10,000.'),
  monthlyPrincipal: z.coerce.number().min(1, 'Minimum principal payment must be positive.'),
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

  try {
    await dbConnect();
    const [user, bankSettings] = await Promise.all([
        User.findById(userSession.id),
        getBankSettings()
    ]);

    if (!user) {
      return { error: 'Could not find your user profile.' };
    }
     if (!bankSettings) {
      return { error: 'Bank settings are not configured. Please contact an administrator.' };
    }

    if (user.role !== 'member') {
        return { error: 'You must be a member to apply for a loan.' };
    }

    // Check for existing loans
    const existingActiveLoans = await Loan.find({ user: user._id, status: 'active' });
    const totalExistingPrincipal = existingActiveLoans.reduce((sum, loan) => sum + loan.principal, 0);
    
    if ((totalExistingPrincipal + loanAmount) > bankSettings.maxLoanAmount) {
         return { error: `The requested amount of ₹${loanAmount.toLocaleString()} exceeds the maximum loan limit of ₹${bankSettings.maxLoanAmount.toLocaleString()}, considering your existing loan balance.` };
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
    
    if (monthlyPrincipal <= 0) {
      return { error: 'Monthly principal payment must be a positive number.' };
    }
    
    const interestRate = bankSettings.loanInterestRate;
    const tenureMonths = calculateLoanTenure(finalLoanAmount, interestRate, monthlyPrincipal);
    if (tenureMonths === Infinity) {
        return { error: 'Monthly payment is too low to cover interest. Please choose a higher amount.'};
    }
    
     if (tenureMonths > bankSettings.maxLoanTenureMonths) {
        return { error: `The calculated loan tenure of ${tenureMonths} months exceeds the maximum allowed tenure of ${bankSettings.maxLoanTenureMonths} months. Please increase your monthly payment.`};
    }

    await Loan.create({
      user: user._id,
      loanAmount: finalLoanAmount,
      principal: finalLoanAmount, 
      interestRate,
      status: 'pending',
      payments: [],
      monthlyPrincipalPayment: monthlyPrincipal,
      loanTenureMonths: tenureMonths,
      fundShortfall: {
          share: shareFundShortfall,
          guaranteed: guaranteedFundShortfall
      }
    });

  } catch (error: any) {
    console.error('============== LOAN APPLICATION FAILED ==============');
    console.error('Error Object:', error);
    console.error('=====================================================');
    const errorMessage = error.message || 'An unknown error occurred.';
    return { error: `An unexpected error occurred: ${errorMessage}` };
  }

  revalidatePath('/dashboard');
  revalidatePath('/admin/approvals');
  redirect('/dashboard');
}
