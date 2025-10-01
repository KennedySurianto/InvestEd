import type { UserRole } from "./UserRole";

export interface User {
    user_id: string; // UUID
    full_name: string;
    email: string;
    role: UserRole;
    membership_expires_at: string | null; // ISO 8601 date string
    created_at: string; // ISO 8601 date string
    updated_at: string; // ISO 8601 date string
}