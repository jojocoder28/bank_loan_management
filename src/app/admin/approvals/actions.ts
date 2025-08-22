
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


async function updateLoanStatus(formData: FormData, newStatus: 'active' | 'rejected'): Promise<void> {
    const loanId = formData.get('loanId') as string;
    if (!loanId) {
        throw new Error('Loan ID is missing');
    }
    
    await dbConnect();
    
    const updateData: { status: 'active' | 'rejected', issueDate?: Date } = { status: newStatus };
    
    if (newStatus === 'active') {
        updateData.issueDate = new Date();
    }

    await Loan.findByIdAndUpdate(loanId, updateData);

    revalidatePath('/admin/approvals');
    revalidatePath('/dashboard'); // To update member's dashboard
    revalidatePath('/admin/users'); // To update loan history on user detail page
}

export async function approveLoan(formData: FormData) {
    await updateLoanStatus(formData, 'active');
}

export async function rejectLoan(formData: FormData) {
    await updateLoanStatus(formData, 'rejected');
}
