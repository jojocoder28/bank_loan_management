
"use server";

import dbConnect from "@/lib/mongodb";
import Loan from "@/models/loan";
import User, { IUser, UserStatus } from "@/models/user";
import Settlement from "@/models/settlement";
import { revalidatePath } from "next/cache";
import { getBankSettings } from "../settings/actions";
import { calculateAnnualInterest, calculateDividend, calculateRequiredFunds } from "@/lib/coop-calculations";
import { calculateLoanTenure } from "@/lib/calculations";
import { Resend } from "resend";
import bcrypt from "bcrypt";
import { logAuditActivity } from "@/lib/audit";
import { getSession } from "@/lib/session";
import nodemailer from "nodemailer";
import crypto from "crypto";


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


export async function deactivateUser(formData: FormData): Promise<{error?: string, success?: boolean, message?: string}> {
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

        const activeLoans = await Loan.find({ user: userId, status: 'active' });
        const totalOutstandingLoan = activeLoans.reduce((sum, loan) => sum + loan.principal, 0);
        const originalSF = user.shareFund || 0;
        const originalGF = user.guaranteedFund || 0;
        const originalTF = user.thriftFund || 0;
        const originalDF = user.dividendFund || 0;
        const totalFunds = originalSF + originalGF + originalTF + originalDF;
        const settlementBalance = totalFunds - totalOutstandingLoan;

        // Reset funds to 0
        user.shareFund = 0;
        user.guaranteedFund = 0;
        user.thriftFund = 0;
        user.dividendFund = 0;
        user.status = 'inactive';

        await user.save();

        // Create a pending Settlement record
        await Settlement.create({
            user: userId,
            type: 'deactivation',
            shareFund: originalSF,
            guaranteedFund: originalGF,
            thriftFund: originalTF,
            dividendFund: originalDF,
            totalFunds,
            totalOutstandingLoan,
            settlementBalance,
            status: 'pending'
        });

        const session = await getSession() as any;
        const actor = session?.email || 'Admin';
        await logAuditActivity(
            'USER_DEACTIVATED',
            actor,
            userId,
            `Deactivated user ${user.name}. Total funds ₹${totalFunds.toLocaleString()} offset against loan ₹${totalOutstandingLoan.toLocaleString()}. Settlement balance: ₹${settlementBalance.toLocaleString()}. A pending settlement record has been created for manual tracking.`,
            { totalFunds, totalOutstandingLoan, settlementBalance }
        );

        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${userId}`);
        revalidatePath("/admin/settlements");

        let message = `User ${user.name} has been deactivated. Total funds: ₹${totalFunds.toLocaleString()}. Outstanding loan: ₹${totalOutstandingLoan.toLocaleString()}. `;
        if (settlementBalance >= 0) {
            message += `Admin will give the user ₹${settlementBalance.toLocaleString()}. Please complete this manually in the Settlements section.`;
        } else {
            message += `User will give the admin ₹${Math.abs(settlementBalance).toLocaleString()}. Please complete this manually in the Settlements section.`;
        }

        return { success: true, message };
        
    } catch (error: any) {
        console.error("Error deactivating user:", error);
        return { error: `Failed to deactivate user: ${error.message}` };
    }
}

export async function retireUser(formData: FormData): Promise<{error?: string, success?: boolean, message?: string}> {
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
        user.dividendFund = (user.dividendFund || 0) + sfDividend;
        
        // 3. Thrift Fund Interest
        const monthlyThrift = bankSettings.monthlyThriftContribution;
        const tfInterestRate = bankSettings.thriftFundInterestRate / 100;

        // The logic for TF interest is more complex (sum of months). We'll approximate with pro-rata.
        // A more accurate formula would be needed for precise accounting.
        const fullYearTfInterest = 78 * monthlyThrift * (tfInterestRate / 12);
        const tfInterest = fullYearTfInterest * proRataFactor;
        user.thriftFund = (user.thriftFund || 0) + tfInterest;
        
        // Calculate settlement details before clearing user's funds
        const activeLoans = await Loan.find({ user: userId, status: 'active' });
        const totalOutstandingLoan = activeLoans.reduce((sum, loan) => sum + loan.principal, 0);
        const originalSF = user.shareFund || 0;
        const originalGF = user.guaranteedFund || 0;
        const originalTF = user.thriftFund || 0;
        const originalDF = user.dividendFund || 0;
        const totalFunds = originalSF + originalGF + originalTF + originalDF;
        const settlementBalance = totalFunds - totalOutstandingLoan;

        // Reset funds to 0
        user.shareFund = 0;
        user.guaranteedFund = 0;
        user.thriftFund = 0;
        user.dividendFund = 0;
        user.status = 'retired';

        await user.save();

        // Create a pending Settlement record
        await Settlement.create({
            user: userId,
            type: 'retirement',
            shareFund: originalSF,
            guaranteedFund: originalGF,
            thriftFund: originalTF,
            dividendFund: originalDF,
            totalFunds,
            totalOutstandingLoan,
            settlementBalance,
            status: 'pending'
        });

        const session = await getSession() as any;
        const actor = session?.email || 'Admin';
        await logAuditActivity(
            'USER_RETIRED',
            actor,
            userId,
            `Retired user ${user.name}. Total funds ₹${totalFunds.toLocaleString()} (including pro-rated interest/dividends) offset against loan ₹${totalOutstandingLoan.toLocaleString()}. Settlement balance: ₹${settlementBalance.toLocaleString()}. A pending settlement record has been created for manual tracking.`,
            { totalFunds, totalOutstandingLoan, settlementBalance }
        );
        
        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${userId}`);
        revalidatePath("/admin/settlements");

        let message = `User ${user.name} has been retired. Total funds: ₹${totalFunds.toLocaleString()}. Outstanding loan: ₹${totalOutstandingLoan.toLocaleString()}. `;
        if (settlementBalance >= 0) {
            message += `Admin will give the user ₹${settlementBalance.toLocaleString()}. Please complete this manually in the Settlements section.`;
        } else {
            message += `User will give the admin ₹${Math.abs(settlementBalance).toLocaleString()}. Please complete this manually in the Settlements section.`;
        }

        return { success: true, message };
        
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
    monthlyPrincipal: number,
    startMonth?: number,
    startYear?: number,
    allowExceeding?: boolean
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
        if (user.role !== 'member' && user.role !== 'board_member') {
            return { error: 'User must be a member or board member to have a loan.' };
        }

        // Check for existing active loans
        const existingActiveLoans = await Loan.find({ user: user._id, status: 'active' });
        const totalExistingPrincipal = existingActiveLoans.reduce((sum, loan) => sum + loan.principal, 0);

        const existingPendingLoan = await Loan.findOne({ user: user._id, status: 'pending' });
        if (existingPendingLoan) {
            return { error: 'User already has a pending loan application.' };
        }

        // Verify that the requested loan amount does not exceed max loan limit
        if ((totalExistingPrincipal + loanAmount) > bankSettings.maxLoanAmount) {
             if (!allowExceeding) {
                  return { 
                      error: `The requested amount would result in a total loan balance of ₹${(totalExistingPrincipal + loanAmount).toLocaleString()}, which exceeds the maximum allowed loan limit of ₹${bankSettings.maxLoanAmount.toLocaleString()}.` 
                  };
             }
        }
        const interestRate = bankSettings.loanInterestRate;
        const tenureMonths = Math.ceil(loanAmount / monthlyPrincipal);
        
        if (tenureMonths > bankSettings.maxLoanTenureMonths) {
            return { error: `Calculated tenure (${tenureMonths} months) exceeds the maximum allowed tenure of ${bankSettings.maxLoanTenureMonths} months.` };
        }

        const now = new Date();
        const finalStartMonth = startMonth !== undefined ? startMonth : now.getMonth();
        const finalStartYear = startYear !== undefined ? startYear : now.getFullYear();

        await Loan.create({
            user: user._id,
            loanAmount: loanAmount,
            principal: loanAmount,
            interestRate,
            status: 'pending',
            payments: [],
            monthlyPrincipalPayment: monthlyPrincipal,
            loanTenureMonths: tenureMonths,
            fundShortfall: {
                share: 0,
                guaranteed: 0
            },
            startMonth: finalStartMonth,
            startYear: finalStartYear
        });

        const session = await getSession();
        const actor = session?.user?.email || 'Admin';
        await logAuditActivity(
            'LOAN_APPLIED_ON_BEHALF',
            actor,
            user._id,
            `Admin applied for a loan of ₹${loanAmount.toLocaleString()} on behalf of member ${user.name} (monthly principal: ₹${monthlyPrincipal.toLocaleString()}).`,
            { loanAmount: loanAmount, monthlyPrincipal }
        );

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
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
  || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:9002');

async function sendGoogleEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  
  if (!smtpEmail || !smtpPassword) {
    throw new Error("Google SMTP credentials (SMTP_EMAIL or SMTP_PASSWORD) are not configured in environment variables.");
  }
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });
  
  await transporter.sendMail({
    from: `"S&KGPPS Co-op" <${smtpEmail}>`,
    to,
    subject,
    html,
  });
}

export async function sendOnboardingEmail(userId: string): Promise<{ error?: string; success?: boolean }> {
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;
    if (!smtpEmail || !smtpPassword) {
        return { error: "Google SMTP credentials (SMTP_EMAIL or SMTP_PASSWORD) are not configured in environment variables. Email cannot be sent." };
    }

    try {
        await dbConnect();
        const user = await User.findById(userId);
        if (!user) return { error: "User not found." };
        if (!user.email) return { error: "User does not have an email address." };

        const defaultPassword = `password${user.membershipNumber}`;

        await sendGoogleEmail({
            to: user.email!,
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

        const session = await getSession();
        const actor = session?.user?.email || 'Admin';
        await logAuditActivity(
            'ONBOARDING_EMAIL_SENT',
            actor,
            user._id,
            `Sent welcome onboarding credentials email to member ${user.name} (${user.email}).`
        );

        return { success: true };
    } catch (e: any) {
        console.error("Error sending onboarding email:", e);
        return { error: e.message || "Failed to send onboarding email." };
    }
}

export async function resetUserPasswordAndEmail(userId: string): Promise<{ error?: string; success?: boolean }> {
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;
    if (!smtpEmail || !smtpPassword) {
        return { error: "Google SMTP credentials (SMTP_EMAIL or SMTP_PASSWORD) are not configured in environment variables. Email cannot be sent." };
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

        await sendGoogleEmail({
            to: user.email!,
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

        const session = await getSession();
        const actor = session?.user?.email || 'Admin';
        await logAuditActivity(
            'PASSWORD_RESET',
            actor,
            user._id,
            `Reset member ${user.name}'s password and emailed secure temporary password.`
        );

        return { success: true };
    } catch (e: any) {
        console.error("Error resetting password and emailing:", e);
        return { error: e.message || "Failed to reset password." };
    }
}

export async function sendBulkOnboardingEmails(): Promise<{ error?: string; success?: string }> {
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;
    if (!smtpEmail || !smtpPassword) {
        return { error: "Google SMTP credentials (SMTP_EMAIL or SMTP_PASSWORD) are not configured in environment variables. Email cannot be sent." };
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

        let sentCount = 0;
        let failedCount = 0;

        for (const user of users) {
            try {
                const defaultPassword = `password${user.membershipNumber}`;
                await sendGoogleEmail({
                    to: user.email!,
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

        const session = await getSession();
        const actor = session?.user?.email || 'Admin';
        await logAuditActivity(
            'ONBOARDING_BULK_EMAILS_SENT',
            actor,
            undefined,
            `Sent bulk welcome onboarding credentials to ${sentCount} members (Failed: ${failedCount}).`,
            { sentCount, failedCount }
        );

        return { success: `Successfully sent onboarding credentials to ${sentCount} members.${failedCount > 0 ? ` Failed to send to ${failedCount} members.` : ''}` };

    } catch (e: any) {
        console.error("Error in bulk onboarding emails:", e);
        return { error: e.message || "Failed to process bulk onboarding emails." };
    }
}

export async function sendPasswordResetEmail(userId: string): Promise<{ error?: string; success?: boolean }> {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
        return { error: "Unauthorized." };
    }

    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;
    if (!smtpEmail || !smtpPassword) {
        return { error: "Google SMTP credentials (SMTP_EMAIL or SMTP_PASSWORD) are not configured in environment variables. Email cannot be sent." };
    }

    try {
        await dbConnect();
        const user = await User.findById(userId);
        if (!user) return { error: "User not found." };
        if (!user.email) return { error: "User does not have an email address." };

        const resetToken = crypto.randomBytes(32).toString('hex');
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiration
        await user.save();

        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        await sendGoogleEmail({
            to: user.email!,
            subject: 'S&KGPPS Co-op: Reset Your Password',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #007bff; text-align: center;">Password Reset Request</h2>
                    <p>Dear <strong>${user.name}</strong>,</p>
                    <p>An administrator has generated a link for you to reset your password for your S&KGPPS Co-op account.</p>
                    <p>Please click the button below to choose a new password. This link is valid for 1 hour:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p>If you did not request a password reset, you can safely ignore this email.</p>
                    <p style="font-size: 0.9em; color: #666;">If you have any questions, please contact an administrator.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 0.8em; color: #999; text-align: center;">This is an automated system email. Please do not reply directly to this message.</p>
                </div>
            `
        });

        const actor = session?.email || 'Admin';
        await logAuditActivity(
            'PASSWORD_RESET_LINK_SENT',
            actor,
            user._id,
            `Sent password reset email to member ${user.name} (${user.email}).`,
            { userId: user._id }
        );

        return { success: true };
    } catch (e: any) {
        console.error("Error sending password reset email:", e);
        return { error: e.message || "Failed to send password reset email." };
    }
}

export async function getSettlements(status?: 'pending' | 'settled'): Promise<any[]> {
    await dbConnect();
    const query: any = {};
    if (status) {
        query.status = status;
    }
    const settlements = await Settlement.find(query)
        .populate('user', 'name membershipNumber bankAccountNumber status')
        .sort({ createdAt: -1 })
        .lean();

    return JSON.parse(JSON.stringify(settlements));
}

export async function settleMemberAccount(settlementId: string): Promise<{ error?: string, success?: boolean }> {
    try {
        await dbConnect();
        const settlement = await Settlement.findById(settlementId);
        if (!settlement) {
            return { error: 'Settlement record not found.' };
        }

        if (settlement.status === 'settled') {
            return { error: 'This settlement has already been completed.' };
        }

        const session = await getSession() as any;
        const actor = session?.email || 'Admin';

        // Settle active loans of this user
        const activeLoans = await Loan.find({ user: settlement.user.toString(), status: 'active' });
        for (const loan of activeLoans) {
            loan.payments.push({
                amount: loan.principal,
                date: new Date(),
                type: 'principal',
                notes: `Settled manually via Settlements page (${settlement.type})`
            } as any);
            loan.principal = 0;
            loan.status = 'paid';
            await loan.save();
        }

        // Update settlement status
        settlement.status = 'settled';
        settlement.settledAt = new Date();
        settlement.settledBy = actor;
        await settlement.save();

        await logAuditActivity(
            'USER_SETTLEMENT_COMPLETED',
            actor,
            settlement.user.toString(),
            `Completed settlement for user. Settle type: ${settlement.type}. Funds: ₹${settlement.totalFunds.toLocaleString()} offset against loans: ₹${settlement.totalOutstandingLoan.toLocaleString()}. Net balance settled: ₹${settlement.settlementBalance.toLocaleString()}.`,
            { settlementId, type: settlement.type }
        );

        revalidatePath("/admin/settlements");
        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${settlement.user.toString()}`);

        return { success: true };
    } catch (e: any) {
        console.error("Error settling member account:", e);
        return { error: e.message || 'An error occurred during settlement.' };
    }
}

export async function updateSettlementAmounts(
    settlementId: string,
    newTotalFunds: number,
    newTotalOutstandingLoan: number
): Promise<{ error?: string, success?: boolean }> {
    try {
        await dbConnect();
        const settlement = await Settlement.findById(settlementId);
        if (!settlement) {
            return { error: 'Settlement record not found.' };
        }

        if (settlement.status === 'settled') {
            return { error: 'Cannot edit a completed settlement.' };
        }

        const oldOutstandingLoan = settlement.totalOutstandingLoan;

        // Update values in settlement record
        settlement.totalFunds = newTotalFunds;
        settlement.totalOutstandingLoan = newTotalOutstandingLoan;
        settlement.settlementBalance = newTotalFunds - newTotalOutstandingLoan;

        await settlement.save();

        // Also update the active loans of the user to match newTotalOutstandingLoan
        const activeLoans = await Loan.find({ user: settlement.user.toString(), status: 'active' });
        
        if (activeLoans.length > 0) {
            if (activeLoans.length === 1) {
                // If there is exactly one active loan, update its principal directly
                activeLoans[0].principal = newTotalOutstandingLoan;
                await activeLoans[0].save();
            } else {
                // If there are multiple active loans, distribute them
                if (oldOutstandingLoan > 0) {
                    const ratio = newTotalOutstandingLoan / oldOutstandingLoan;
                    for (const loan of activeLoans) {
                        loan.principal = Math.round(loan.principal * ratio);
                        await loan.save();
                    }
                } else {
                    const splitAmount = Math.round(newTotalOutstandingLoan / activeLoans.length);
                    for (const loan of activeLoans) {
                        loan.principal = splitAmount;
                        await loan.save();
                    }
                }
            }
        }

        const session = await getSession() as any;
        const actor = session?.email || 'Admin';
        await logAuditActivity(
            'USER_SETTLEMENT_UPDATED',
            actor,
            settlement.user.toString(),
            `Updated settlement amounts. Total Funds: ₹${newTotalFunds.toLocaleString()} (was ₹${newTotalFunds.toLocaleString()}), Outstanding Loan: ₹${newTotalOutstandingLoan.toLocaleString()} (was ₹${oldOutstandingLoan.toLocaleString()}).`,
            { settlementId, newTotalFunds, newTotalOutstandingLoan }
        );

        revalidatePath("/admin/settlements");
        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${settlement.user.toString()}`);

        return { success: true };
    } catch (e: any) {
        console.error("Error updating settlement amounts:", e);
        return { error: e.message || 'An error occurred.' };
    }
}

export async function cancelSettlement(settlementId: string): Promise<{ error?: string, success?: boolean }> {
    try {
        await dbConnect();
        const settlement = await Settlement.findById(settlementId);
        if (!settlement) {
            return { error: 'Settlement record not found.' };
        }

        if (settlement.status === 'settled') {
            return { error: 'Cannot cancel a completed settlement.' };
        }

        const user = await User.findById(settlement.user) as any;
        if (!user) {
            return { error: 'User profile not found.' };
        }

        // Restore original funds
        user.shareFund = (user.shareFund || 0) + settlement.shareFund;
        user.guaranteedFund = (user.guaranteedFund || 0) + settlement.guaranteedFund;
        user.thriftFund = (user.thriftFund || 0) + settlement.thriftFund;
        user.dividendFund = (user.dividendFund || 0) + settlement.dividendFund;
        user.status = 'active'; // Revert back to active member

        await user.save();

        // Delete the pending settlement record
        await Settlement.findByIdAndDelete(settlementId);

        const session = await getSession() as any;
        const actor = session?.email || 'Admin';
        await logAuditActivity(
            'USER_SETTLEMENT_CANCELLED',
            actor,
            user._id.toString(),
            `Cancelled settlement and reactivated user ${user.name}. Restored funds: Share ₹${settlement.shareFund.toLocaleString()}, Guaranteed ₹${settlement.guaranteedFund.toLocaleString()}, Thrift ₹${settlement.thriftFund.toLocaleString()}.`,
            { userId: user._id, type: settlement.type }
        );

        revalidatePath("/admin/settlements");
        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${user._id.toString()}`);

        return { success: true };
    } catch (e: any) {
        console.error("Error cancelling settlement:", e);
        return { error: e.message || 'An error occurred.' };
    }
}
