import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEmailJob extends Document {
    jobType: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    totalCount: number;
    sentCount: number;
    failedCount: number;
    currentRecipient?: string;
    logs: string[];
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}

const EmailJobSchema = new Schema<IEmailJob>({
    jobType: { type: String, required: true, default: 'onboarding_bulk' },
    status: { 
        type: String, 
        enum: ['pending', 'in_progress', 'completed', 'failed'], 
        default: 'pending',
        required: true 
    },
    totalCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    currentRecipient: { type: String },
    logs: [{ type: String }],
    startedAt: { type: Date },
    completedAt: { type: Date },
    error: { type: String },
}, { timestamps: true });

const EmailJob: Model<IEmailJob> = mongoose.models.EmailJob || mongoose.model<IEmailJob>('EmailJob', EmailJobSchema);

export default EmailJob;
