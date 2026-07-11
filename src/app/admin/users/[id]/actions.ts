
"use server";

import dbConnect from "@/lib/mongodb";
import User, { IUser, UserRole } from "@/models/user";
import Loan, { ILoan } from "@/models/loan";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import mongoose from "mongoose";
import { z } from "zod";

interface UserDetails extends Omit<IUser, 'password'> {
  _id: string;
  createdAt: string;
}

interface LoanDetails extends Omit<ILoan, 'user' | 'payments'> {
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

        return {
            user: JSON.parse(JSON.stringify({
                ...userWithoutPassword,
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

    const session = await getSession();

    if (!session || session.role !== 'admin') {
        return { error: "Unauthorized." };
    }

    if (!userId) {
        return { error: "Missing user ID." };
    }

    if (isNaN(shareFund) || shareFund < 0 ||
        isNaN(thriftFund) || thriftFund < 0 ||
        isNaN(guaranteedFund) || guaranteedFund < 0) {
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
                guaranteedFund
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

export async function updateLoanMonthlyPayment(prevState: any, formData: FormData): Promise<{error?: string; success?: boolean}> {
    const loanId = formData.get('loanId') as string;
    const monthlyPrincipalPayment = Number(formData.get('monthlyPrincipalPayment'));

    const session = await getSession();

    if (!session || session.role !== 'admin') {
        return { error: "Unauthorized." };
    }

    if (!loanId) {
        return { error: "Missing loan ID." };
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

        if (monthlyPrincipalPayment > loan.principal) {
            return { error: `Monthly payment cannot exceed the remaining principal of ₹${loan.principal.toLocaleString()}.` };
        }

        await Loan.findByIdAndUpdate(loanId, {
            $set: {
                monthlyPrincipalPayment
            }
        });

        revalidatePath(`/admin/users/${loan.user.toString()}`);
        revalidatePath('/admin/users');
        revalidatePath('/admin/ledger');
        revalidatePath('/admin/statement');
        revalidatePath('/my-finances');

        return { success: true };
    } catch (error) {
        console.error("Failed to update loan monthly payment:", error);
        return { error: "An unexpected error occurred while updating the loan payment." };
    }
}

const updateDetailsSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  phone: z.string().min(10, "Phone number must be at least 10 digits."),
  membershipNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  age: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().int().min(1, "Age must be positive.").optional()),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  profession: z.string().optional(),
  workplace: z.string().optional(),
  workplaceAddress: z.string().optional(),
  personalAddress: z.string().optional(),
  nomineeName: z.string().optional(),
  nomineeRelation: z.string().optional(),
  nomineeAge: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().int().min(1, "Nominee age must be positive.").optional()),
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

      await User.findByIdAndUpdate(userId, {
          $set: {
              name: data.name,
              email: data.email ? data.email.toLowerCase() : null,
              phone: data.phone,
              membershipNumber: data.membershipNumber || null,
              bankAccountNumber: data.bankAccountNumber || null,
              age: data.age || null,
              gender: data.gender || null,
              profession: data.profession || null,
              workplace: data.workplace || null,
              workplaceAddress: data.workplaceAddress || null,
              personalAddress: data.personalAddress || null,
              nomineeName: data.nomineeName || null,
              nomineeRelation: data.nomineeRelation || null,
              nomineeAge: data.nomineeAge || null,
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
