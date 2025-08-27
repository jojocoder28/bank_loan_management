
"use server";

import dbConnect from "@/lib/mongodb";
import Loan, { ILoan } from "@/models/loan";
import User, { IUser } from "@/models/user";
import { revalidatePath } from "next/cache";

interface PopulatedLoan extends Omit<ILoan, 'user'> {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
        shareFund: number;
        guaranteedFund: number;
    }
}

export async function getPendingLoans(): Promise<PopulatedLoan[]> {
    await dbConnect();
    const loans = await Loan.find({ status: 'pending' })
        .populate<{user: IUser}>({
            path: 'user',
            select: 'name email shareFund guaranteedFund'
        })
        .sort({ createdAt: 'asc' })
        .lean();

    return JSON.parse(JSON.stringify(loans));
}

export async function getPendingMemberships(): Promise<IUser[]> {
    await dbConnect();
    const users = await User.find({ role: 'user', membershipApplied: true }).sort({ createdAt: 'asc' }).lean();
    return JSON.parse(JSON.stringify(users));
}


async function updateLoanStatus(formData: FormData, newStatus: 'active' | 'rejected'): Promise<void> {
    const loanId = formData.get('loanId') as string;
    if (!loanId) {
        throw new Error('Loan ID is missing');
    }
    
    await dbConnect();

    const loan = await Loan.findById(loanId);
    if (!loan) {
        throw new Error('Loan not found');
    }

    if (newStatus === 'active') {
        loan.status = 'active';
        loan.issueDate = new Date();

        // If there was a fund shortfall, update the user's funds now
        if (loan.fundShortfall && (loan.fundShortfall.share > 0 || loan.fundShortfall.guaranteed > 0)) {
            const user = await User.findById(loan.user);
            if (user) {
                user.shareFund = (user.shareFund || 0) + (loan.fundShortfall.share || 0);
                user.guaranteedFund = (user.guaranteedFund || 0) + (loan.fundShortfall.guaranteed || 0);
                await user.save();
            }
        }
    } else { // 'rejected'
        loan.status = 'rejected';
    }

    await loan.save();

    revalidatePath('/admin/approvals');
    revalidatePath('/dashboard'); 
    revalidatePath('/admin/users'); 
}

export async function approveLoan(formData: FormData) {
    await updateLoanStatus(formData, 'active');
}

export async function rejectLoan(formData: FormData) {
    await updateLoanStatus(formData, 'rejected');
}

type ApproveMembershipState = {
    error: string | null;
}

export async function approveMembership(prevState: ApproveMembershipState, formData: FormData): Promise<ApproveMembershipState> {
    const userId = formData.get('userId') as string;
    const membershipNumber = formData.get('membershipNumber') as string;

    if (!userId || !membershipNumber) {
        return { error: 'User ID and Membership Number are required.' }
    }

    await dbConnect();

    // Check if membership number is already taken
    const existingUser = await User.findOne({ membershipNumber });
    if (existingUser) {
        return { error: 'This membership number is already assigned.' }
    }

    await User.findByIdAndUpdate(userId, {
        role: 'member',
        membershipNumber: membershipNumber,
        thriftFund: 1000 // Initialize thrift fund with the first month's contribution
    });

    revalidatePath('/admin/approvals');
    revalidatePath('/admin/users');
    revalidatePath('/become-member');
    revalidatePath('/apply-loan');

    return { error: null };
}
