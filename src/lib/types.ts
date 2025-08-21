import type { UserRole } from "@/models/user";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string;
}

export interface DecodedToken {
    user: User;
    iat: number;
    exp: number;
}
