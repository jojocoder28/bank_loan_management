import mongoose, { Document, Model, Schema } from 'mongoose';

export type ReportType = 'monthly_statement' | 'yearly_dues' | 'dividend';

export interface IReport extends Document {
    title: string;
    type: ReportType;
    year: number;
    month?: number; // 0-indexed for monthly statement
    pdfUrl?: string;
    csvUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
    title: { type: String, required: true },
    type: { type: String, enum: ['monthly_statement', 'yearly_dues', 'dividend'], required: true },
    year: { type: Number, required: true },
    month: { type: Number },
    pdfUrl: { type: String },
    csvUrl: { type: String },
}, { timestamps: true });

const Report: Model<IReport> = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
export default Report;
