import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBenefit extends Document {
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
}

const BenefitSchema = new Schema<IBenefit>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true, default: 'HelpCircle' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Benefit: Model<IBenefit> = mongoose.models.Benefit || mongoose.model<IBenefit>('Benefit', BenefitSchema);

export default Benefit;
