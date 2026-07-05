
"use server";

import dbConnect from "@/lib/mongodb";
import Loan from "@/models/loan";
import User, { IUser, UserStatus } from "@/models/user";
import { revalidatePath } from "next/cache";
import { getBankSettings } from "../settings/actions";
import { calculateAnnualInterest, calculateDividend, calculateRequiredFunds } from "@/lib/coop-calculations";
import { calculateLoanTenure } from "@/lib/calculations";
import { Resend } from "resend";
import bcrypt from "bcrypt";


export async function getUsers(status?: UserStatus): Promise<IUser[]> {
    await dbConnect();
    
    const query: any = {};
    if (status && ['active', 'inactive', 'retired'].includes(status)) {
        query.status = status;
    } else {
        // By default, do not show retired members in the main list
        query.status = { $ne: 'retired' };
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    return JSON.parse(JSON.stringify(users.map(user => ({
      ...user,
      _id: user._id.toString(),
    }))));
}


export async function deactivateUser(formData: FormData): Promise<{error?: string, success?: boolean}> {
    const userId = formData.get('userId') as string;

    if (!userId) {
        return { error: 'User ID not provided' };
    }

    try {
        await dbConnect();

        // Check for active loans
        const activeLoan = await Loan.findOne({ user: userId, status: 'active' });
        if (activeLoan) {
            return { error: 'Cannot deactivate a user with an active loan. The loan must be paid or settled first.' };
        }

        await User.findByIdAndUpdate(userId, { status: 'inactive' });
        
        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${userId}`);
        return { success: true };
        
    } catch (error) {
        console.error("Error deactivating user:", error);
        return { error: 'Failed to deactivate user.' };
    }
}

export async function retireUser(formData: FormData): Promise<{error?: string, success?: boolean}> {
    const userId = formData.get('userId') as string;

    if (!userId) {
        return { error: 'User ID not provided' };
    }

    try {
        await dbConnect();
        
        const [user, bankSettings] = await Promise.all([
            User.findById(userId),
            getBankSettings()
        ]);

        if (!user) {
            return { error: 'User not found.' };
        }
        
        // Check for active loans
        const activeLoan = await Loan.findOne({ user: userId, status: 'active' });
        if (activeLoan) {
            return { error: 'Cannot retire a user with an active loan. The loan must be paid or settled first.' };
        }

        // --- Pro-rata Interest & Dividend Calculation ---
        const now = new Date();
        const currentMonth = now.getMonth(); // 0 = Jan, 3 = April, 2 = March
        const currentYear = now.getFullYear();
        
        // Financial year starts in April (month 3)
        const financialYearStartMonth = 3; 
        
        let monthsInFinancialYear;
        if (currentMonth >= financialYearStartMonth) {
            // We are in the current financial year (e.g. retiring in Oct 2024, FY is Apr 2024 - Mar 2025)
            monthsInFinancialYear = currentMonth - financialYearStartMonth + 1;
        } else {
            // We are in the start of the calendar year, but end of the financial year (e.g. retiring in Feb 2025, FY is Apr 2024 - Mar 2025)
            monthsInFinancialYear = currentMonth + (12 - financialYearStartMonth) + 1;
        }

        // Calculate pro-rated interest/dividend
        const proRataFactor = monthsInFinancialYear / 12;

        // 1. Guaranteed Fund Interest
        const gfInterest = calculateAnnualInterest(user.guaranteedFund || 0, bankSettings.guaranteedFundInterestRate) * proRataFactor;
        user.guaranteedFund = (user.guaranteedFund || 0) + gfInterest;
        
        // 2. Share Fund Dividend
        const sfDividend = calculateDividend(user.shareFund || 0, bankSettings.shareFundDividendRate) * proRataFactor;
        user.shareFund = (user.shareFund || 0) + sfDividend;
        
        // 3. Thrift Fund Interest
        const monthlyThrift = bankSettings.monthlyThriftContribution;
        const tfInterestRate = bankSettings.thriftFundInterestRate / 100;

        // The logic for TF interest is more complex (sum of months). We'll approximate with pro-rata.
        // A more accurate formula would be needed for precise accounting.
        const fullYearTfInterest = 78 * monthlyThrift * (tfInterestRate / 12);
        const tfInterest = fullYearTfInterest * proRataFactor;
        user.thriftFund = (user.thriftFund || 0) + tfInterest;
        
        user.status = 'retired';
        await user.save();
        
        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${userId}`);
        return { success: true };
        
    } catch (error: any) {
        console.error("Error retiring user:", error);
        return { error: `Failed to retire user: ${error.message}` };
    }
}


export async function activateUser(formData: FormData): Promise<{error?: string, success?: boolean}> {
    const userId = formData.get('userId') as string;

    if (!userId) {
        return { error: 'User ID not provided' };
    }

    try {
        await dbConnect();
        
        const user = await User.findById(userId);

        if (!user) {
            return { error: 'User not found.' };
        }

        if (user.status === 'retired') {
            return { error: 'A retired member cannot be made active again.' };
        }

        user.status = 'active';
        await user.save();
        
        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${userId}`);
        return { success: true };
        
    } catch (error) {
        console.error("Error activating user:", error);
        return { error: 'Failed to activate user.' };
    }
}

export async function deleteUser(formData: FormData) {
    const userId = formData.get('userId') as string;

    if (!userId) {
        throw new Error('User ID not provided');
    }

    try {
        await dbConnect();

        // Optional: Check if user can be deleted (e.g., no active loans)
        const activeLoan = await Loan.findOne({ user: userId, status: 'active' });
        if (activeLoan) {
            // In a real app, you'd return an error object to the client
            throw new Error('Cannot delete a user with an active loan.');
        }

        await User.findByIdAndDelete(userId);
        
        revalidatePath("/admin/users");
        
    } catch (error) {
        console.error("Error deleting user:", error);
        // In a real app, you'd handle this more gracefully
        throw new Error('Failed to delete user.');
    }
}

export async function applyLoanOnBehalf(
    userId: string,
    loanAmount: number,
    monthlyPrincipal: number
): Promise<{ error?: string; success?: boolean }> {
    try {
        await dbConnect();
        const [user, bankSettings] = await Promise.all([
            User.findById(userId),
            getBankSettings()
        ]);

        if (!user) {
            return { error: 'User not found.' };
        }
        if (!bankSettings) {
            return { error: 'Bank settings are not configured.' };
        }
        if (user.role !== 'member') {
            return { error: 'User must be a member to have a loan.' };
        }

        // Check for existing active loans
        const existingActiveLoans = await Loan.find({ user: user._id, status: 'active' });
        const totalExistingPrincipal = existingActiveLoans.reduce((sum, loan) => sum + loan.principal, 0);

        const existingPendingLoan = await Loan.findOne({ user: user._id, status: 'pending' });
        if (existingPendingLoan) {
            return { error: 'User already has a pending loan application.' };
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

        const finalLoanAmount = loanAmount + totalShortfall;

        // Verify that the final total outstanding principal (including the top-up) does not exceed max loan limit
        if ((totalExistingPrincipal + finalLoanAmount) > bankSettings.maxLoanAmount) {
             return { 
                 error: `The requested amount (including the automatic fund top-up of ₹${totalShortfall.toLocaleString()}) would result in a total loan balance of ₹${(totalExistingPrincipal + finalLoanAmount).toLocaleString()}, which exceeds the maximum allowed loan limit of ₹${bankSettings.maxLoanAmount.toLocaleString()}.` 
             };
        }
        const interestRate = bankSettings.loanInterestRate;
        const tenureMonths = calculateLoanTenure(finalLoanAmount, interestRate, monthlyPrincipal);
        
        if (tenureMonths === Infinity) {
            return { error: 'Monthly payment is too low to cover interest.' };
        }
        if (tenureMonths > bankSettings.maxLoanTenureMonths) {
            return { error: `Calculated tenure (${tenureMonths} months) exceeds the maximum allowed tenure of ${bankSettings.maxLoanTenureMonths} months.` };
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

        revalidatePath(`/admin/users/${userId}`);
        revalidatePath('/admin/approvals');
        return { success: true };

    } catch (error: any) {
        console.error('Error applying loan on behalf:', error);
        return { error: error.message || 'Failed to apply for loan on behalf.' };
    }
}

// Mailer configurations
const fromEmail = 'S&KGPPS Co-op <onboarding@resend.dev>';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

export async function sendOnboardingEmail(userId: string): Promise<{ error?: string; success?: boolean }> {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        return { error: "Resend API key is not configured. Email cannot be sent." };
    }

    try {
        await dbConnect();
        const user = await User.findById(userId);
        if (!user) return { error: "User not found." };
        if (!user.email) return { error: "User does not have an email address." };

        const resend = new Resend(resendApiKey);
        const defaultPassword = `password${user.membershipNumber}`;

        await resend.emails.send({
            from: fromEmail,
            to: user.email,
            subject: 'S&KGPPS Co-op: Your Account Credentials',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #007bff; text-align: center;">Welcome to S&KGPPS Co-op</h2>
                    <p>Dear <strong>${user.name}</strong>,</p>
                    <p>An administrator has set up your member account for the Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD.</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Membership #:</strong> ${user.membershipNumber || 'N/A'}</p>
                        <p style="margin: 5px 0;"><strong>Username (Email):</strong> ${user.email}</p>
                        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-size: 1.1em;">${defaultPassword}</code></p>
                    </div>
                    <p>Please click the button below to log in. You will be prompted to change this temporary password upon your first login:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${baseUrl}/login" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log In to Account</a>
                    </div>
                    <p style="font-size: 0.9em; color: #666;">If you have any questions, please contact an administrator.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 0.8em; color: #999; text-align: center;">This is an automated system email. Please do not reply directly to this message.</p>
                </div>
            `
        });

        return { success: true };
    } catch (e: any) {
        console.error("Error sending onboarding email:", e);
        return { error: e.message || "Failed to send onboarding email." };
    }
}

export async function resetUserPasswordAndEmail(userId: string): Promise<{ error?: string; success?: boolean }> {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        return { error: "Resend API key is not configured. Email cannot be sent." };
    }

    try {
        await dbConnect();
        const user = await User.findById(userId);
        if (!user) return { error: "User not found." };
        if (!user.email) return { error: "User does not have an email address." };

        // Generate temporary reset password
        const rawTempPassword = `SK@${Math.floor(100000 + Math.random() * 900000)}`;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawTempPassword, salt);

        // Update database
        await User.updateOne(
            { _id: userId },
            { 
                $set: { 
                    password: hashedPassword,
                    requiresPasswordChange: true 
                } 
            }
        );

        const resend = new Resend(resendApiKey);

        await resend.emails.send({
            from: fromEmail,
            to: user.email,
            subject: 'S&KGPPS Co-op: Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #dc3545; text-align: center;">Password Reset Request</h2>
                    <p>Dear <strong>${user.name}</strong>,</p>
                    <p>Your password for the Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD has been reset by an administrator.</p>
                    <div style="background-color: #fff3f3; padding: 15px; border-left: 4px solid #dc3545; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Username:</strong> ${user.email || user.phone}</p>
                        <p style="margin: 5px 0;"><strong>Temporary Reset Password:</strong> <code style="background: #f8d7da; padding: 2px 6px; border-radius: 4px; font-size: 1.1em; color: #721c24;">${rawTempPassword}</code></p>
                    </div>
                    <p>Please log in using this temporary password. You will be forced to create a new secure password immediately:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${baseUrl}/login" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log In & Reset Password</a>
                    </div>
                    <p style="font-size: 0.9em; color: #666;">If you did not request this reset, please contact the administrator immediately.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 0.8em; color: #999; text-align: center;">This is an automated system email. Please do not reply directly to this message.</p>
                </div>
            `
        });

        return { success: true };
    } catch (e: any) {
        console.error("Error resetting password and emailing:", e);
        return { error: e.message || "Failed to reset password." };
    }
}

export async function sendBulkOnboardingEmails(): Promise<{ error?: string; success?: string }> {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        return { error: "Resend API key is not configured. Email cannot be sent." };
    }

    try {
        await dbConnect();
        // Find all active members with email who have not changed their password yet
        const users = await User.find({
            role: 'member',
            status: 'active',
            email: { $ne: null },
            requiresPasswordChange: true
        });

        if (users.length === 0) {
            return { success: "No pending member accounts found that require password onboarding emails." };
        }

        const resend = new Resend(resendApiKey);
        let sentCount = 0;
        let failedCount = 0;

        for (const user of users) {
            try {
                const defaultPassword = `password${user.membershipNumber}`;
                await resend.emails.send({
                    from: fromEmail,
                    to: user.email,
                    subject: 'Welcome to S&KGPPS Co-op: Your Account Credentials',
                    html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #007bff; text-align: center;">Welcome to S&KGPPS Co-op</h2>
                            <p>Dear <strong>${user.name}</strong>,</p>
                            <p>An administrator has set up your member account for the Sarisha & Khorda G P Primary School Teachers Co Operative Credit Society LTD.</p>
                            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Membership #:</strong> ${user.membershipNumber || 'N/A'}</p>
                                <p style="margin: 5px 0;"><strong>Username (Email):</strong> ${user.email}</p>
                                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-size: 1.1em;">${defaultPassword}</code></p>
                            </div>
                            <p>Please click the button below to log in. You will be prompted to change this temporary password upon your first login:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${baseUrl}/login" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Log In to Account</a>
                            </div>
                            <p style="font-size: 0.9em; color: #666;">If you have any questions, please contact an administrator.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 0.8em; color: #999; text-align: center;">This is an automated system email. Please do not reply directly to this message.</p>
                        </div>
                    `
                });
                sentCount++;
            } catch (err) {
                console.error(`Failed to send bulk onboarding email to ${user.email}:`, err);
                failedCount++;
            }
        }

        return { success: `Successfully sent onboarding credentials to ${sentCount} members.${failedCount > 0 ? ` Failed to send to ${failedCount} members.` : ''}` };

    } catch (e: any) {
        console.error("Error in bulk onboarding emails:", e);
        return { error: e.message || "Failed to process bulk onboarding emails." };
    }
}
