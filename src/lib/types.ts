
import type { UserRole } from "@/models/user";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    photoUrl?: string;
    membershipApplied?: boolean;
}

export interface DecodedToken {
    user: User;
    iat: number;
    exp: number;
}
