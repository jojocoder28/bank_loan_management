import { ObjectId } from 'mongodb';

export type UserRole = 'admin' | 'board_member' | 'member';

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
