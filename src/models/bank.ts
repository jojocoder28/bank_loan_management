
import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for the Bank document
export interface IBank extends Document {
  loanInterestRate: number;
  thriftFundInterestRate: number;
  shareFundDividendRate: number;
  guaranteedFundInterestRate: number;
  initialShareFundDeposit: number;
  monthlyThriftContribution: number;
  maxLoanTenureMonths: number;
  maxLoanAmount: number;
  lastMonthlyProcess?: Date;
  lastAnnualProcess?: Date;
  lastGuaranteedFundProcess?: Date;
  lastAnnualAllProcess?: Date; // New field for master annual process
  // This is a unique key to ensure we only have one document
  singleton: string; 
}

// Mongoose Schema for the Bank
const BankSchema = new Schema<IBank>({
  loanInterestRate: { type: Number, required: true, default: 10 },
  thriftFundInterestRate: { type: Number, required: true, default: 6 },
  shareFundDividendRate: { type: Number, required: true, default: 12 },
  guaranteedFundInterestRate: { type: Number, required: true, default: 4 },
  initialShareFundDeposit: { type: Number, required: true, default: 5000 },
  monthlyThriftContribution: { type: Number, required: true, default: 1000 },
  maxLoanTenureMonths: { type: Number, required: true, default: 60 },
  maxLoanAmount: { type: Number, required: true, default: 600000 },
  lastMonthlyProcess: { type: Date },
  lastAnnualProcess: { type: Date },
  lastGuaranteedFundProcess: { type: Date },
  lastAnnualAllProcess: { type: Date }, // New field
  singleton: { type: String, default: 'bank-settings', unique: true }
});

// Prevent model recompilation in Next.js hot-reloading environments
const Bank: Model<IBank> = mongoose.models.Bank || mongoose.model<IBank>('Bank', BankSchema);

export default Bank;
