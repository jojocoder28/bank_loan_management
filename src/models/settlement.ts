import mongoose, { Document, Model, Schema } from 'mongoose';
import type { IUser } from './user';

export type SettlementStatus = 'pending' | 'settled';

export interface ISettlement extends Document {
    user: any;
    type: 'deactivation' | 'retirement';
    totalFunds: number;
    totalOutstandingLoan: number;
    settlementBalance: number; // totalFunds - totalOutstandingLoan
    status: SettlementStatus;
    settledAt?: Date;
    settledBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['deactivation', 'retirement'], required: true },
    totalFunds: { type: Number, required: true },
    totalOutstandingLoan: { type: Number, required: true },
    settlementBalance: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'settled'], default: 'pending', required: true },
    settledAt: { type: Date },
    settledBy: { type: String },
}, { timestamps: true });

const Settlement: Model<ISettlement> = mongoose.models.Settlement || mongoose.model<ISettlement>('Settlement', SettlementSchema);

export default Settlement;
