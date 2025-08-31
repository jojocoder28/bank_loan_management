
"use server";

import dbConnect from "@/lib/mongodb";
import Loan from "@/models/loan";
import User, { IUser, UserStatus } from "@/models/user";
import { revalidatePath } from "next/cache";
import { getBankSettings } from "../settings/actions";
import { calculateAnnualInterest, calculateDividend } from "@/lib/coop-calculations";


export async function getUsers(status?: UserStatus): Promise<IUser[]> {
    await dbConnect();
    
    const query: Partial<{ status: UserStatus }> = {};
    if (status && ['active', 'inactive', 'retired'].includes(status)) {
        query.status = status;
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

        await User.findByIdAndUpdate(userId, { status: 'active' });
        
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
