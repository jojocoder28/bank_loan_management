import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export type UserRole = 'admin' | 'board_member' | 'member';

// Interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

// Mongoose Schema
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false }, // Hide password by default
  role: {
    type: String,
    enum: ['admin', 'board_member', 'member'],
    default: 'member',
  },
  createdAt: { type: Date, default: Date.now },
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
