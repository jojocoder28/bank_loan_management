
"use server";

import dbConnect from "@/lib/mongodb";
import User, { IUser } from "@/models/user";
import Loan, { ILoan } from "@/models/loan";
import { notFound } from "next/navigation";

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
