
import mongoose, { Document, Model, Schema } from 'mongoose';
import type { IUser } from './user';

export type LoanStatus = 'pending' | 'active' | 'paid' | 'rejected';

// Interface for a single payment record
export interface IPayment extends Document {
    amount: number;
    date: Date;
    type: 'principal' | 'interest';
    notes?: string;
}

// Interface for the Loan document
export interface ILoan extends Document {
    user: IUser['_id'];
    loanAmount: number;
    principal: number; // outstanding principal
    interestRate: number; // annual interest rate
    issueDate?: Date;
    status: LoanStatus;
    payments: IPayment[];
    createdAt: Date;
    updatedAt: Date;
    monthlyPrincipalPayment: number;
    loanTenureMonths?: number;
    fundShortfall: {
        share: number;
        guaranteed: number;
    };
}

// Mongoose Schema for Payments
const PaymentSchema = new Schema<IPayment>({
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['principal', 'interest'], required: true },
    notes: { type: String },
});

// Mongoose Schema for Loans
const LoanSchema = new Schema<ILoan>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    loanAmount: { type: Number, required: true },
    principal: { type: Number, required: true },
    interestRate: { type: Number, required: true }, // e.g., 10 for 10%
    issueDate: { type: Date },
    status: {
        type: String,
        enum: ['pending', 'active', 'paid', 'rejected'],
        default: 'pending',
        required: true,
    },
    payments: [PaymentSchema],
    monthlyPrincipalPayment: { type: Number, required: true },
    loanTenureMonths: { type: Number },
    fundShortfall: {
        share: { type: Number, default: 0 },
        guaranteed: { type: Number, default: 0 }
    }
}, { timestamps: true });


// Prevent model recompilation in Next.js hot-reloading environments
const Loan: Model<ILoan> = mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);

export default Loan;
