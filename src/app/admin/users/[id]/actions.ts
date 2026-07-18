
"use server";

import dbConnect from "@/lib/mongodb";
import User, { IUser, UserRole } from "@/models/user";
import Loan, { ILoan } from "@/models/loan";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import mongoose from "mongoose";
import { z } from "zod";
import { calculateAge } from "@/lib/calculations";
import { logAuditActivity } from "@/lib/audit";

interface UserDetails extends Omit<IUser, 'password' | 'createdAt'> {
  _id: string;
  createdAt: string;
}

interface LoanDetails extends Omit<ILoan, 'user' | 'payments' | 'issueDate' | 'createdAt' | 'updatedAt'> {
    _id: string;
    issueDate: string;
    createdAt: string;
    updatedAt: string;
    payments: any[];
}


export async function getUserDetails(id: string): Promise<{ user: UserDetails; loans: LoanDetails[] }> {
    try {
        await dbConnect();

        const user = await User.findById(id).lean();
        if (!user) {
            notFound();
        }

        const loans = await Loan.find({ user: user._id }).sort({ createdAt: -1 }).lean();

        // Sanitize user data
        const { password, ...userWithoutPassword } = user;
        const calculatedAge = user.dob ? calculateAge(user.dob) : (user.age || null);
        const calculatedNomineeAge = user.nomineeDob ? calculateAge(user.nomineeDob) : (user.nomineeAge || null);

        return {
            user: JSON.parse(JSON.stringify({
                ...userWithoutPassword,
                age: calculatedAge,
                nomineeAge: calculatedNomineeAge,
                _id: user._id.toString()
            })),
            loans: JSON.parse(JSON.stringify(loans.map(loan => ({
                ...loan,
                _id: loan._id.toString(),
                user: loan.user.toString()
            }))))
        };

    } catch (error) {
        console.error("Failed to get user details:", error);
        if (error instanceof mongoose.Error.CastError) {
             notFound();
        }
        // In a real app, you might want to throw the error to be caught by an error boundary
        throw new Error("Failed to load user details.");
    }
}


export async function updateUserRole(prevState: any, formData: FormData): Promise<{error?: string}> {
    const userId = formData.get('userId') as string;
    const role = formData.get('role') as UserRole;
    
    const session = await getSession();

    if (!session || session.role !== 'admin') {
        return { error: "Unauthorized." };
    }

    if (session.id === userId) {
        return { error: "You cannot change your own role." };
    }
    
    if (!userId || !role) {
        return { error: "Missing user ID or role." };
    }

    try {
        await dbConnect();
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
            return { error: "User not found." };
        }
        if (userToUpdate.role === 'admin') {
            return { error: "Cannot change the role of an administrator." };
        }

        await User.findByIdAndUpdate(userId, { role });
        
        revalidatePath(`/admin/users/${userId}`);
        revalidatePath('/admin/users');

        return {};
    } catch (error) {
        console.error(error);
        return { error: "An unexpected error occurred." };
    }
}

export async function updateUserCapital(prevState: any, formData: FormData): Promise<{error?: string; success?: boolean}> {
    const userId = formData.get('userId') as string;
    const shareFund = Number(formData.get('shareFund'));
    const thriftFund = Number(formData.get('thriftFund'));
    const guaranteedFund = Number(formData.get('guaranteedFund'));
    const dividendFund = Number(formData.get('dividendFund'));

    const session = await getSession();

    if (!session || session.role !== 'admin') {
        return { error: "Unauthorized." };
    }

    if (!userId) {
        return { error: "Missing user ID." };
    }

    if (isNaN(shareFund) || shareFund < 0 ||
        isNaN(thriftFund) || thriftFund < 0 ||
        isNaN(guaranteedFund) || guaranteedFund < 0 ||
        isNaN(dividendFund) || dividendFund < 0) {
        return { error: "Capital/fund values must be non-negative numbers." };
    }

    try {
        await dbConnect();
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
            return { error: "User not found." };
        }

        await User.findByIdAndUpdate(userId, {
            $set: {
                shareFund,
                thriftFund,
                guaranteedFund,
                dividendFund
            }
        });

        revalidatePath(`/admin/users/${userId}`);
        revalidatePath('/admin/users');
        revalidatePath('/admin/ledger');
        revalidatePath('/admin/statement');
        revalidatePath('/my-finances');

        return { success: true };
    } catch (error) {
        console.error("Failed to update user capital:", error);
        return { error: "An unexpected error occurred while updating funds." };
    }
}

export async function updateLoanDetails(prevState: any, formData: FormData): Promise<{error?: string; success?: boolean}> {
    const loanId = formData.get('loanId') as string;
    const loanAmount = Number(formData.get('loanAmount'));
    const principal = Number(formData.get('principal'));
    const monthlyPrincipalPayment = Number(formData.get('monthlyPrincipalPayment'));

    const session = await getSession();

    if (!session || session.role !== 'admin') {
        return { error: "Unauthorized." };
    }

    if (!loanId) {
        return { error: "Missing loan ID." };
    }

    if (isNaN(loanAmount) || loanAmount < 0) {
        return { error: "Loan Amount must be a positive number." };
    }

    if (isNaN(principal) || principal < 0) {
        return { error: "Outstanding Principal must be a positive number." };
    }

    if (isNaN(monthlyPrincipalPayment) || monthlyPrincipalPayment < 0) {
        return { error: "Monthly principal payment must be a non-negative number." };
    }

    try {
        await dbConnect();
        const loan = await Loan.findById(loanId);
        if (!loan) {
            return { error: "Loan not found." };
        }

        const tenureMonths = monthlyPrincipalPayment > 0 ? Math.ceil(principal / monthlyPrincipalPayment) : loan.loanTenureMonths;

        await Loan.findByIdAndUpdate(loanId, {
            $set: {
                loanAmount,
                principal,
                monthlyPrincipalPayment,
                loanTenureMonths: tenureMonths
            }
        });

        // Record activity to the database audit trail
        const userToUpdate = await User.findById(loan.user as any);
        const actor = session?.email || 'Admin';
        await logAuditActivity(
            'LOAN_MODIFIED_BY_ADMIN',
            actor,
            loan.user as any,
            `Admin modified loan details for ${userToUpdate?.name || 'N/A'}. New Amount: ₹${loanAmount.toLocaleString()}, New Principal: ₹${principal.toLocaleString()}, New Monthly Payment: ₹${monthlyPrincipalPayment.toLocaleString()}.`,
            { loanId, loanAmount, principal, monthlyPrincipalPayment }
        );

        revalidatePath(`/admin/users/${(loan.user as any).toString()}`);
        revalidatePath('/admin/users');
        revalidatePath('/admin/ledger');
        revalidatePath('/admin/statement');
        revalidatePath('/my-finances');

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update loan details:", error);
        return { error: error.message || "Failed to update loan details." };
    }
}

const updateDetailsSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  membershipNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  dob: z.preprocess((val) => (val === '' ? null : val), z.coerce.date().nullable().optional()),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  profession: z.string().optional(),
  workplace: z.string().optional(),
  workplaceAddress: z.string().optional(),
  personalAddress: z.string().optional(),
  nomineeName: z.string().optional(),
  nomineeRelation: z.string().optional(),
  nomineeDob: z.preprocess((val) => (val === '' ? null : val), z.coerce.date().nullable().optional()),
});

export async function updateUserDetails(prevState: any, formData: FormData): Promise<{ error?: any; success?: boolean }> {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
      return { error: { form: ["Unauthorized."] } };
  }

  const values = Object.fromEntries(formData.entries());
  
  const validatedFields = updateDetailsSchema.safeParse(values);
  if (!validatedFields.success) {
      return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { userId, ...data } = validatedFields.data;

  try {
      await dbConnect();

      // Check duplicate phone
      const existingUserByPhone = await User.findOne({ phone: data.phone, _id: { $ne: userId } });
      if (existingUserByPhone) {
          return { error: { phone: ["An account with this phone number already exists."] } };
      }

      // Check duplicate membershipNumber if provided
      if (data.membershipNumber) {
          const existingUserByNum = await User.findOne({ membershipNumber: data.membershipNumber, _id: { $ne: userId } });
          if (existingUserByNum) {
              return { error: { membershipNumber: ["This membership number is already assigned."] } };
          }
      }

      // Check duplicate email if provided
      if (data.email) {
          const existingUserByEmail = await User.findOne({ email: data.email.toLowerCase(), _id: { $ne: userId } });
          if (existingUserByEmail) {
              return { error: { email: ["An account with this email already exists."] } };
          }
      }

      const dobDate = data.dob ? new Date(data.dob) : null;
      const nomineeDobDate = data.nomineeDob ? new Date(data.nomineeDob) : null;
      const calculatedAge = dobDate ? calculateAge(dobDate) : null;
      const calculatedNomineeAge = nomineeDobDate ? calculateAge(nomineeDobDate) : null;

      await User.findByIdAndUpdate(userId, {
          $set: {
              name: data.name,
              email: data.email ? data.email.toLowerCase() : null,
              phone: data.phone,
              membershipNumber: data.membershipNumber || null,
              bankAccountNumber: data.bankAccountNumber || null,
              age: calculatedAge,
              dob: dobDate,
              gender: data.gender || null,
              profession: data.profession || null,
              workplace: data.workplace || null,
              workplaceAddress: data.workplaceAddress || null,
              personalAddress: data.personalAddress || null,
              nomineeName: data.nomineeName || null,
              nomineeRelation: data.nomineeRelation || null,
              nomineeAge: calculatedNomineeAge,
              nomineeDob: nomineeDobDate,
          }
      });

      revalidatePath(`/admin/users/${userId}`);
      revalidatePath('/admin/users');

      return { success: true };
  } catch (error) {
      console.error("Failed to update user details:", error);
      return { error: { form: ["An unexpected database error occurred."] } };
  }
}
