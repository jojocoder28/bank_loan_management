import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: string;
  bgGradient?: string;
  ctaText?: string;
  ctaLink?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
}

const BannerSchema = new Schema<IBanner>({
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String, required: true },
  imageUrl: { type: String },
  bgGradient: { type: String, default: 'from-blue-600/20 via-indigo-600/10 to-transparent' },
  ctaText: { type: String },
  ctaLink: { type: String },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Banner: Model<IBanner> = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);

export default Banner;
