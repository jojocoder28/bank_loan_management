
'use server';

import { z } from 'zod';
import { getSession } from '@/lib/session';
import { logAuditActivity } from '@/lib/audit';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import Loan from '@/models/loan';
import { calculateRequiredFunds } from '@/lib/coop-calculations';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { calculateLoanTenure } from '@/lib/calculations';
import { getBankSettings } from '../admin/settings/actions';

const applyLoanSchema = z.object({
  loanAmount: z.coerce.number().min(10000, 'Minimum loan amount is ₹10,000.'),
  monthlyPrincipal: z.coerce.number().min(1, 'Minimum principal payment must be positive.'),
  startMonth: z.coerce.number().min(0).max(11),
  startYear: z.coerce.number().min(2000).max(2100),
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

  const { loanAmount, monthlyPrincipal, startMonth, startYear } = validatedFields.data;

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

    // Check for existing active loans
    const existingActiveLoans = await Loan.find({ user: user._id, status: 'active' });
    const totalExistingPrincipal = existingActiveLoans.reduce((sum, loan) => sum + loan.principal, 0);

    const existingPendingLoan = await Loan.findOne({ user: user._id, status: 'pending' });
    if (existingPendingLoan) {
        return { error: 'You already have a loan application pending approval. Please wait for it to be processed.' };
    }

    // Calculate required funds: 5% of (total existing loan principal left + new requested loan amount)
    const totalTargetAmount = totalExistingPrincipal + loanAmount;
    const requiredShare = totalTargetAmount * 0.05;
    const requiredGuaranteed = totalTargetAmount * 0.05;

    const userShareFund = user.shareFund || 0;
    const userGuaranteedFund = user.guaranteedFund || 0;
    
    const shareFundShortfall = Math.max(0, requiredShare - userShareFund);
    const guaranteedFundShortfall = Math.max(0, requiredGuaranteed - userGuaranteedFund);
    const totalShortfall = shareFundShortfall + guaranteedFundShortfall;

    // The actual loan amount to be disbursed, including any shortfall
    const finalLoanAmount = loanAmount + totalShortfall;

    // Verify that the final total outstanding principal (including the top-up) does not exceed max loan limit
    if ((totalExistingPrincipal + finalLoanAmount) > bankSettings.maxLoanAmount) {
         return { 
             error: `The requested amount (including the automatic fund top-up of ₹${totalShortfall.toLocaleString()}) would result in a total loan balance of ₹${(totalExistingPrincipal + finalLoanAmount).toLocaleString()}, which exceeds the maximum allowed loan limit of ₹${bankSettings.maxLoanAmount.toLocaleString()}.` 
         };
    }
    
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
      },
      startMonth,
      startYear
    });

    // Record activity to the database audit trail
    await logAuditActivity(
        'LOAN_APPLIED',
        user.email || 'Unknown Member',
        user._id,
        `Member applied for a new loan of ₹${finalLoanAmount.toLocaleString()} (chosen monthly principal: ₹${monthlyPrincipal.toLocaleString()}).`,
        { loanAmount: finalLoanAmount, monthlyPrincipal }
    );

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
