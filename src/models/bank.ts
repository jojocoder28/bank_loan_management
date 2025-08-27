
import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for the Bank document
export interface IBank extends Document {
  loanInterestRate: number;
  thriftFundInterestRate: number;
  shareFundDividendRate: number;
  initialShareFundDeposit: number;
  monthlyThriftContribution: number;
  // This is a unique key to ensure we only have one document
  singleton: string; 
}

// Mongoose Schema for the Bank
const BankSchema = new Schema<IBank>({
  loanInterestRate: { type: Number, required: true, default: 10 },
  thriftFundInterestRate: { type: Number, required: true, default: 6 },
  shareFundDividendRate: { type: Number, required: true, default: 12 },
  initialShareFundDeposit: { type: Number, required: true, default: 5000 },
  monthlyThriftContribution: { type: Number, required: true, default: 1000 },
  singleton: { type: String, default: 'bank-settings', unique: true }
});

// Prevent model recompilation in Next.js hot-reloading environments
const Bank: Model<IBank> = mongoose.models.Bank || mongoose.model<IBank>('Bank', BankSchema);

export default Bank;
