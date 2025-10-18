
import mongoose, { Document, Model, Schema } from 'mongoose';

// Interface for the temporary bulk import data
export interface IBulkImportData extends Document {
  fullName: string;
  membershipNumber?: string;
  phoneNumber: string;
  email?: string;
  joinDate: Date;
  personalAddress: string;
  age: number;
  gender: string;
  profession: string;
  workplace: string;
  workplaceAddress: string;
  bankAccountNumber: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeAge: number;
  isExported: boolean;
  createdAt: Date;
}

// Mongoose Schema for the temporary data
const BulkImportDataSchema = new Schema<IBulkImportData>({
  fullName: { type: String, required: true },
  membershipNumber: { type: String },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  joinDate: { type: Date, required: true },
  personalAddress: { type: String },
  age: { type: Number },
  gender: { type: String },
  profession: { type: String },
  workplace: { type: String },
  workplaceAddress: { type: String },
  bankAccountNumber: { type: String },
  nomineeName: { type: String },
  nomineeRelation: { type: String },
  nomineeAge: { type: Number },
  isExported: { type: Boolean, default: false }, // To track if it has been included in a download
}, { timestamps: true });

// Prevent model recompilation in Next.js hot-reloading environments
const BulkImportData: Model<IBulkImportData> = mongoose.models.BulkImportData || mongoose.model<IBulkImportData>('BulkImportData', BulkImportDataSchema);

export default BulkImportData;
