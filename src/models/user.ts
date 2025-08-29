
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export type UserRole = 'admin' | 'board_member' | 'member' | 'user';
export type Gender = 'male' | 'female' | 'other' | '';

// Interface for the User document
export interface IUser extends Document {
  name: string;
  email?: string | null;
  phone: string;
  password?: string;
  role: UserRole;
  createdAt: Date;
  membershipApplied?: boolean;
  isVerified?: boolean;
  // verificationToken?: string;
  // verificationTokenExpires?: Date;
  phoneOtp?: string;
  phoneOtpExpires?: Date;


  // New Fields
  photoUrl?: string;
  workplace?: string;
  profession?: string;
  workplaceAddress?: string;
  personalAddress?: string;
  membershipNumber?: string;
  // phone?: string;
  bankAccountNumber?: string;
  age?: number;
  gender?: Gender;

  // Fund Balances
  shareFund?: number;
  guaranteedFund?: number;
  thriftFund?: number;

  // Nominee Details
  nomineeName?: string;
  nomineeRelation?: string;
  nomineeAge?: number;
  
  comparePassword(password: string): Promise<boolean>;
}

// Mongoose Schema
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: false, unique: true, sparse: true, lowercase: true },
  phone: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false }, // Hide password by default
  role: {
    type: String,
    enum: ['admin', 'board_member', 'member', 'user'],
    default: 'user',
  },
  membershipApplied: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  // verificationToken: { type: String },
  // verificationTokenExpires: { type: Date },
  phoneOtp: { type: String },
  phoneOtpExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  
  // New Fields
  photoUrl: { type: String },
  workplace: { type: String },
  profession: { type: String },
  workplaceAddress: { type: String },
  personalAddress: { type: String },
  membershipNumber: { type: String, unique: true, sparse: true }, // unique but can be null
  // phone: { type: String },
  bankAccountNumber: { type: String },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other', ''] },

  // Fund Balances
  shareFund: { type: Number, default: 0 },
  guaranteedFund: { type: Number, default: 0 },
  thriftFund: { type: Number, default: 0 },

  // Nominee Details
  nomineeName: { type: String },
  nomineeRelation: { type: String },
  nomineeAge: { type: Number },
});

// Pre-save hook to hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err as Error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = function (password: string): Promise<boolean> {
  if (!this.password) {
    return Promise.resolve(false);
  }
  return bcrypt.compare(password, this.password);
};


// Prevent model recompilation in Next.js hot-reloading environments
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
