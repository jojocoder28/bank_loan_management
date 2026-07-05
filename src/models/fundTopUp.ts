
import mongoose, { Document, Model, Schema } from 'mongoose';

export type FundTopUpType = 'sf' | 'gf' | 'split';

export interface IFundTopUp extends Document {
    user: mongoose.Types.ObjectId;
    sfAmount: number;       // amount added to Share Fund
    gfAmount: number;       // amount added to Guaranteed Fund
    totalAmount: number;
    type: FundTopUpType;
    note?: string;
    addedBy: string;        // admin email or 'system'
    month: number;          // 0-indexed month this will appear in statement
    year: number;
    includedInStatement: boolean;
    createdAt: Date;
}

const FundTopUpSchema = new Schema<IFundTopUp>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sfAmount: { type: Number, required: true, default: 0 },
    gfAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    type: { type: String, enum: ['sf', 'gf', 'split'], required: true },
    note: { type: String },
    addedBy: { type: String, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    includedInStatement: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now },
});

const FundTopUp: Model<IFundTopUp> =
    mongoose.models.FundTopUp || mongoose.model<IFundTopUp>('FundTopUp', FundTopUpSchema);

export default FundTopUp;
