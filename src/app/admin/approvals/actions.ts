
"use server";

import dbConnect from "@/lib/mongodb";
import Loan, { ILoan, IModificationRequest, ModificationRequestStatus } from "@/models/loan";
import User, { IUser } from "@/models/user";
import ProfileModificationRequest, { IProfileModificationRequest } from "@/models/profileModification";
import { revalidatePath } from "next/cache";
import { calculateRequiredFunds } from "@/lib/coop-calculations";
import { getBankSettings } from "../settings/actions";
import { logAuditActivity } from "@/lib/audit";
import { getSession } from "@/lib/session";
import { calculateAge } from "@/lib/calculations";

interface PopulatedLoan extends Omit<ILoan, 'user'> {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
        shareFund: number;
        guaranteedFund: number;
    };
    calculatedShortfall?: {
        share: number;
        guaranteed: number;
    };
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

    const validLoans = loans.filter((loan) => loan.user);

    const populatedLoans = await Promise.all(validLoans.map(async (loan) => {
        // Find existing active loans for the user
        const existingActiveLoans = await Loan.find({ user: loan.user._id, status: 'active' });
        const totalExistingPrincipal = existingActiveLoans.reduce((sum, activeL) => sum + activeL.principal, 0);

        // Required Share / Guaranteed funds based on (total existing active principal + requested loan amount)
        const totalTargetAmount = totalExistingPrincipal + loan.loanAmount;
        const requiredShare = totalTargetAmount * 0.05;
        const requiredGuaranteed = totalTargetAmount * 0.05;

        const shareShortfall = Math.max(0, requiredShare - (loan.user.shareFund || 0));
        const guaranteedShortfall = Math.max(0, requiredGuaranteed - (loan.user.guaranteedFund || 0));

        return {
            ...loan,
            calculatedShortfall: {
                share: shareShortfall,
                guaranteed: guaranteedShortfall
            }
        };
    }));

    return JSON.parse(JSON.stringify(populatedLoans));
}

export async function getPendingMemberships(): Promise<IUser[]> {
    await dbConnect();
    // Find users who have applied but are not yet members
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
    }).filter(loan => loan.modificationRequests.length > 0 && loan.user);


    return JSON.parse(JSON.stringify(loansWithPending));
}

export async function getPendingApprovalCount(): Promise<number> {
    await dbConnect();
    
    const [pendingLoansCount, pendingMembershipsCount, pendingModifications] = await Promise.all([
        Loan.countDocuments({ status: 'pending' }),
        User.countDocuments({ role: 'user', membershipApplied: true }),
        // This is less efficient but reflects the logic in getPendingModifications
        Loan.find({ 'modificationRequests.status': 'pending' }).lean() 
    ]);

    const pendingModificationsCount = pendingModifications.reduce((count, loan) => {
        return count + loan.modificationRequests.filter(req => req.status === 'pending').length;
    }, 0);

    const pendingProfileModificationsCount = await ProfileModificationRequest.countDocuments({ status: 'pending' });

    return pendingLoansCount + pendingMembershipsCount + pendingModificationsCount + pendingProfileModificationsCount;
}


async function updateLoanStatus(formData: FormData, newStatus: 'active' | 'rejected'): Promise<{error?: string; success?: boolean}> {
    const loanId = formData.get('loanId') as string;
    if (!loanId) {
        return { error: 'Loan ID is missing' };
    }
    
    await dbConnect();

    const loan = await Loan.findById(loanId);
    if (!loan) {
        return { error: 'Loan not found' };
    }
    
    const userToUpdate = await User.findById(loan.user);

    const session = await getSession();
    const actor = session?.user?.email || 'Admin';

    if (newStatus === 'active') {
        const startMonthStr = formData.get('startMonth') as string;
        const startYearStr = formData.get('startYear') as string;
        const loanAmountStr = formData.get('loanAmount') as string;
        const shareFundTopUpStr = formData.get('shareFundTopUp') as string;
        const guaranteedFundTopUpStr = formData.get('guaranteedFundTopUp') as string;
        const monthlyPrincipalPaymentStr = formData.get('monthlyPrincipalPayment') as string;

        const now = new Date();
        const startMonth = startMonthStr !== null && startMonthStr !== '' ? Number(startMonthStr) : (loan.startMonth !== undefined ? loan.startMonth : now.getMonth());
        const startYear = startYearStr !== null && startYearStr !== '' ? Number(startYearStr) : (loan.startYear !== undefined ? loan.startYear : now.getFullYear());

        const requestedAmount = Number(loanAmountStr || loan.loanAmount);
        const shareFundTopUp = Number(shareFundTopUpStr || 0);
        const guaranteedFundTopUp = Number(guaranteedFundTopUpStr || 0);
        const monthlyPrincipalPayment = Number(monthlyPrincipalPaymentStr || loan.monthlyPrincipalPayment);

        const totalShortfall = shareFundTopUp + guaranteedFundTopUp;
        const finalLoanAmount = requestedAmount + totalShortfall;

        const tenureMonths = Math.ceil(finalLoanAmount / monthlyPrincipalPayment);

        // Verify that the final total outstanding principal does not exceed max loan limit
        const existingActiveLoans = await Loan.find({ user: loan.user, status: 'active', _id: { $ne: loan._id } });
        const totalExistingPrincipal = existingActiveLoans.reduce((sum, activeL) => sum + activeL.principal, 0);
        const bankSettings = await getBankSettings();
        const allowExceeding = formData.get('allowExceeding') === 'true';
        
        if (bankSettings && (totalExistingPrincipal + finalLoanAmount) > bankSettings.maxLoanAmount) {
            if (!allowExceeding) {
                return { error: `The approved amount of ₹${finalLoanAmount.toLocaleString()} would bring the member's total outstanding principal to ₹${(totalExistingPrincipal + finalLoanAmount).toLocaleString()}, exceeding the maximum limit of ₹${bankSettings.maxLoanAmount.toLocaleString()}.` };
            }
        }

        loan.status = 'active';
        loan.loanAmount = finalLoanAmount;
        loan.principal = finalLoanAmount;
        loan.monthlyPrincipalPayment = monthlyPrincipalPayment;
        loan.loanTenureMonths = tenureMonths;
        loan.startMonth = startMonth;
        loan.startYear = startYear;
        loan.issueDate = new Date(startYear, startMonth, 1);
        loan.fundShortfall = {
            share: shareFundTopUp,
            guaranteed: guaranteedFundTopUp
        };

        // If there was a fund shortfall, update the user's funds now
        if (userToUpdate) {
            userToUpdate.shareFund = (userToUpdate.shareFund || 0) + shareFundTopUp;
            userToUpdate.guaranteedFund = (userToUpdate.guaranteedFund || 0) + guaranteedFundTopUp;
            await userToUpdate.save();
        }

        await logAuditActivity(
            'LOAN_APPROVED',
            actor,
            loan.user,
            `Approved loan of ₹${loan.loanAmount.toLocaleString()} for member ${userToUpdate?.name || 'N/A'}.`,
            { loanId: loan._id, loanAmount: loan.loanAmount }
        );
    } else { // 'rejected'
        loan.status = 'rejected';

        await logAuditActivity(
            'LOAN_REJECTED',
            actor,
            loan.user,
            `Rejected loan application of ₹${loan.loanAmount.toLocaleString()} for member ${userToUpdate?.name || 'N/A'}.`,
            { loanId: loan._id, loanAmount: loan.loanAmount }
        );
    }

    await loan.save();

    revalidatePath('/admin/approvals');
    revalidatePath('/dashboard'); 
    revalidatePath('/admin/users');
    if (userToUpdate) {
        revalidatePath(`/admin/users/${(userToUpdate as any)._id.toString()}`);
    }


    return { success: true };
}

export async function approveLoan(formData: FormData) {
    return await updateLoanStatus(formData, 'active');
}

export async function rejectLoan(formData: FormData) {
    return await updateLoanStatus(formData, 'rejected');
}

export async function approveMembership(formData: FormData): Promise<{error?: string, success?: boolean}> {
    const userId = formData.get('userId') as string;
    const membershipNumber = formData.get('membershipNumber') as string;

    if (!userId || !membershipNumber) {
        return { error: 'User ID and Membership Number are required.' }
    }

    await dbConnect();
    const existingUser = await User.findOne({ membershipNumber });

    if (existingUser) {
        return { error: 'This membership number is already assigned.' }
    }

    const userToOnboard = await User.findById(userId);
    await User.findByIdAndUpdate(userId, {
        role: 'member',
        membershipNumber: membershipNumber,
    });

    const session = await getSession();
    const actor = session?.user?.email || 'Admin';
    await logAuditActivity(
        'MEMBERSHIP_APPROVED',
        actor,
        userId,
        `Approved membership for candidate ${userToOnboard?.name || 'N/A'} with Membership Number ${membershipNumber}.`,
        { membershipNumber }
    );

    revalidatePath('/admin/approvals');
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/become-member');
    revalidatePath('/apply-loan');
    revalidatePath('/dashboard');

    return { success: true };
}

export async function rejectMembership(formData: FormData): Promise<{error?: string, success?: boolean}> {
    const userId = formData.get('userId') as string;

    if (!userId) {
        return { error: 'User ID is required.' }
    }

    await dbConnect();

    const [user, bankSettings] = await Promise.all([
        User.findById(userId),
        getBankSettings()
    ]);

    if (!user) {
        return { error: 'User not found.' };
    }

    if (user.role !== 'user' || !user.membershipApplied) {
        return { error: 'This user does not have a pending membership application.' };
    }

    // Revert the application status and refund the initial deposit
    user.membershipApplied = false;
    user.shareFund = (user.shareFund || 0) - bankSettings.initialShareFundDeposit;
    if (user.shareFund < 0) user.shareFund = 0; // Prevent negative funds

    await user.save();

    const session = await getSession();
    const actor = session?.user?.email || 'Admin';
    await logAuditActivity(
        'MEMBERSHIP_REJECTED',
        actor,
        userId,
        `Rejected membership application for candidate ${user?.name || 'N/A'}.`
    );
    
    revalidatePath('/admin/approvals');
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath('/become-member');

    return { success: true };
}


async function updateModificationStatus(formData: FormData, newStatus: ModificationRequestStatus): Promise<{error?: string, success?: boolean}> {
    const loanId = formData.get('loanId') as string;
    const requestId = formData.get('requestId') as string;

    if (!loanId || !requestId) {
        return { error: 'Loan ID or Request ID is missing' };
    }

    await dbConnect();
    const loan = await Loan.findById(loanId).populate('user');
    if (!loan) {
        return { error: 'Loan not found' };
    }

    const request = (loan.modificationRequests as any).id(requestId);
    if (!request) {
        return { error: 'Modification request not found' };
    }

    request.status = newStatus;
    

    if (newStatus === 'approved') {
        request.approvalDate = new Date();
        if (request.type === 'increase_amount') {
            const increaseAmount = request.requestedValue;
            
            const { requiredShare, requiredGuaranteed } = calculateRequiredFunds(increaseAmount);
            const totalRequiredFunds = requiredShare + requiredGuaranteed;
            
            // The top-up amount is added to the loan principal
            const totalIncreaseToPrincipal = increaseAmount + totalRequiredFunds;

            loan.principal += totalIncreaseToPrincipal;
            loan.loanAmount += totalIncreaseToPrincipal;
            
            // Top up user's funds.
            const user = loan.user as IUser;
            user.shareFund = (user.shareFund ?? 0) + requiredShare;
            user.guaranteedFund = (user.guaranteedFund ?? 0) + requiredGuaranteed;
            await user.save();
        }
        if (request.type === 'change_payment') {
            if (request.requestType === 'permanent') {
                loan.monthlyPrincipalPayment = request.requestedValue;
            }
        }
    }

    const session = await getSession();
    const actor = session?.user?.email || 'Admin';
    await logAuditActivity(
        newStatus === 'approved' ? 'MODIFICATION_APPROVED' : 'MODIFICATION_REJECTED',
        actor,
        loan.user._id,
        `${newStatus === 'approved' ? 'Approved' : 'Rejected'} modification request of type "${request.type}" (Requested: ₹${request.requestedValue.toLocaleString()}) for member ${(loan.user as any).name || 'N/A'}.`,
        { type: request.type, requestedValue: request.requestedValue }
    );

    await loan.save();
    revalidatePath('/admin/approvals');
    revalidatePath('/my-finances');
    revalidatePath(`/admin/users/${(loan.user as any)._id.toString()}`);
    return { success: true };
}


export async function approveModification(formData: FormData) {
    return await updateModificationStatus(formData, 'approved');
}

export async function rejectModification(formData: FormData) {
    return await updateModificationStatus(formData, 'rejected');
}

export interface PopulatedProfileModification extends Omit<IProfileModificationRequest, 'user'> {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
        membershipNumber: string;
        phone: string;
    }
}

export async function getPendingProfileModifications(): Promise<PopulatedProfileModification[]> {
    await dbConnect();
    const requests = await ProfileModificationRequest.find({ status: 'pending' })
        .populate('user', 'name email membershipNumber phone')
        .sort({ requestDate: 'asc' })
        .lean();
    const validRequests = requests.filter(req => req.user);
    return JSON.parse(JSON.stringify(validRequests));
}

export async function approveProfileModification(formData: FormData) {
    const requestId = formData.get('requestId') as string;
    if (!requestId) return { error: 'Request ID missing' };
    await dbConnect();
    const request = await ProfileModificationRequest.findById(requestId);
    if (!request || request.status !== 'pending') return { error: 'Invalid or missing request' };
    
    const user = await User.findById(request.user);
    if (!user) return { error: 'User not found' };

    // Apply changes
    Object.assign(user, request.requestedChanges);
    if ((request.requestedChanges as any).nomineeDob) {
        user.nomineeAge = calculateAge((request.requestedChanges as any).nomineeDob) as any;
    }
    await user.save();

    request.status = 'approved';
    request.approvalDate = new Date();
    await request.save();

    revalidatePath('/admin/approvals');
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${(user as any)._id.toString()}`);
    return { success: true };
}

export async function rejectProfileModification(formData: FormData) {
    const requestId = formData.get('requestId') as string;
    if (!requestId) return { error: 'Request ID missing' };
    await dbConnect();
    const request = await ProfileModificationRequest.findById(requestId);
    if (!request || request.status !== 'pending') return { error: 'Invalid request' };

    request.status = 'rejected';
    await request.save();

    revalidatePath('/admin/approvals');
    return { success: true };
}
