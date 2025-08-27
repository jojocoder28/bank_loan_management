
import mongoose, { Document, Model, Schema } from 'mongoose';
import type { IUser } from './user';

export type LoanStatus = 'pending' | 'active' | 'paid' | 'rejected';
export type ModificationRequestType = 'increase_amount' | 'change_payment';
export type ModificationRequestStatus = 'pending' | 'approved' | 'rejected';


// Interface for a single payment record
export interface IPayment extends Document {
    amount: number;
    date: Date;
    type: 'principal' | 'interest';
    notes?: string;
}

// Interface for a loan modification request
export interface IModificationRequest extends Document {
    type: ModificationRequestType;
    requestedValue: number;
    status: ModificationRequestStatus;
    requestDate: Date;
    approvalDate?: Date;
    notes?: string;
    // For payment changes, which month it applies to
    effectiveMonth?: number; 
    effectiveYear?: number;
}


// Interface for the Loan document
export interface ILoan extends Document {
    user: IUser['_id'];
    loanAmount: number;
    principal: number; // outstanding principal
    interestRate: number; // annual interest rate
    issueDate?: Date | null;
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
    modificationRequests: IModificationRequest[];
}

// Mongoose Schema for Payments
const PaymentSchema = new Schema<IPayment>({
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['principal', 'interest'], required: true },
    notes: { type: String },
});

const ModificationRequestSchema = new Schema<IModificationRequest>({
    type: { type: String, enum: ['increase_amount', 'change_payment'], required: true },
    requestedValue: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestDate: { type: Date, default: Date.now },
    approvalDate: { type: Date },
    notes: { type: String },
    effectiveMonth: { type: Number },
    effectiveYear: { type: Number },
});

// Mongoose Schema for Loans
const LoanSchema = new Schema<ILoan>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    loanAmount: { type: Number, required: true },
    principal: { type: Number, required: true },
    interestRate: { type: Number, required: true }, // e.g., 10 for 10%
    issueDate: { type: Date, required: false },
    status: {
        type: String,
        enum: ['pending', 'active', 'paid', 'rejected'],
        default: 'pending',
        required: true,
    },
    payments: [PaymentSchema],
    monthlyPrincipalPayment: { type: Number, required: true, default: 0 },
    loanTenureMonths: { type: Number },
    fundShortfall: {
        share: { type: Number, default: 0 },
        guaranteed: { type: Number, default: 0 }
    },
    modificationRequests: [ModificationRequestSchema],
}, { timestamps: true });


// Prevent model recompilation in Next.js hot-reloading environments
const Loan: Model<ILoan> = mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);

export default Loan;
