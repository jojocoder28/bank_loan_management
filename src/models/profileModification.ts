import mongoose, { Document, Model, Schema } from 'mongoose';
import type { IUser } from './user';

export type ProfileModificationStatus = 'pending' | 'approved' | 'rejected';

export interface IProfileModificationRequest extends Document {
    user: IUser['_id'];
    requestedChanges: {
        personalAddress?: string;
        workplaceAddress?: string;
        nomineeName?: string;
        nomineeRelation?: string;
        nomineeAge?: number;
    };
    status: ProfileModificationStatus;
    requestDate: Date;
    approvalDate?: Date;
    notes?: string;
}

const ProfileModificationSchema = new Schema<IProfileModificationRequest>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestedChanges: {
        personalAddress: { type: String },
        workplaceAddress: { type: String },
        nomineeName: { type: String },
        nomineeRelation: { type: String },
        nomineeAge: { type: Number },
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    requestDate: { type: Date, default: Date.now },
    approvalDate: { type: Date },
    notes: { type: String },
}, { timestamps: true });

const ProfileModificationRequest: Model<IProfileModificationRequest> = mongoose.models.ProfileModificationRequest || mongoose.model<IProfileModificationRequest>('ProfileModificationRequest', ProfileModificationSchema);

export default ProfileModificationRequest;
