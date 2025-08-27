
"use server";

import dbConnect from "@/lib/mongodb";
import Loan, { ILoan, IModificationRequest, ModificationRequestStatus } from "@/models/loan";
import User, { IUser } from "@/models/user";
import { revalidatePath } from "next/cache";
import { calculateRequiredFunds } from "@/lib/coop-calculations";

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

export interface PopulatedModificationLoan extends Omit<ILoan, 'user' | 'modificationRequests'> {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
    },
    modificationRequests: (Omit<IModificationRequest, '_id'> & { _id: string })[];
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

export async function getPendingModifications(): Promise<PopulatedModificationLoan[]> {
    await dbConnect();
    const loans = await Loan.find({ 
        status: 'active',
        'modificationRequests.status': 'pending' 
    })
    .populate<{user: IUser}>({
        path: 'user',
        select: 'name email'
    })
    .sort({ 'modificationRequests.requestDate': 'asc' })
    .lean();

    // We need to filter the modificationRequests array in JS because MongoDB can't filter sub-arrays and return the parent document if other sub-array elements don't match.
    const loansWithPending = loans.map(loan => {
        const pendingRequests = loan.modificationRequests.filter(req => req.status === 'pending');
        return { ...loan, modificationRequests: pendingRequests };
    }).filter(loan => loan.modificationRequests.length > 0);


    return JSON.parse(JSON.stringify(loansWithPending));
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
    revalidatePath('/dashboard');

    return { error: null };
}

async function updateModificationStatus(formData: FormData, newStatus: ModificationRequestStatus) {
    const loanId = formData.get('loanId') as string;
    const requestId = formData.get('requestId') as string;

    if (!loanId || !requestId) {
        throw new Error('Loan ID or Request ID is missing');
    }

    await dbConnect();
    const loan = await Loan.findById(loanId).populate('user');
    if (!loan) {
        throw new Error('Loan not found');
    }

    const request = loan.modificationRequests.id(requestId);
    if (!request) {
        throw new Error('Modification request not found');
    }

    request.status = newStatus;
    request.approvalDate = new Date();

    if (newStatus === 'approved') {
        if (request.type === 'increase_amount') {
            const increaseAmount = request.requestedValue;
            
            const { requiredShare, requiredGuaranteed } = calculateRequiredFunds(increaseAmount);
            const fundTopUp = requiredShare + requiredGuaranteed;
            const netIncreaseToPrincipal = increaseAmount - fundTopUp;

            // Increase the loan principal and total amount
            loan.principal += netIncreaseToPrincipal;
            loan.loanAmount += increaseAmount;
            
            // Top up user's funds
            const user = loan.user as IUser;
            user.shareFund = (user.shareFund ?? 0) + requiredShare;
            user.guaranteedFund = (user.guaranteedFund ?? 0) + requiredGuaranteed;
            await user.save();
        }
        // Note: For 'change_payment', we don't change the base `monthlyPrincipalPayment`.
        // The change is temporary and will be handled by the payment processing/walkthrough logic.
    }

    await loan.save();
    revalidatePath('/admin/approvals');
    revalidatePath('/my-finances');
}


export async function approveModification(formData: FormData) {
    await updateModificationStatus(formData, 'approved');
}

export async function rejectModification(formData: FormData) {
    await updateModificationStatus(formData, 'rejected');
}
