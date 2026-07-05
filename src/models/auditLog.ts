import mongoose, { Document, Model, Schema } from 'mongoose';
import type { IUser } from './user';

export interface IAuditLog extends Document {
    action: string;      // e.g., 'LOAN_APPLIED', 'LOAN_APPROVED', 'MONTHLY_DEDUCTION_PROCESSED', etc.
    actor: string;       // Admin user email/ID, Member user email/ID, or 'SYSTEM'
    targetUser?: IUser['_id'] | any; // Affected member profile
    details: string;     // Short description of the operation
    metadata?: string;   // Structured payload details as JSON
    timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    action: { type: String, required: true, index: true },
    actor: { type: String, required: true, index: true },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: false },
    details: { type: String, required: true },
    metadata: { type: String, required: false },
    timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
