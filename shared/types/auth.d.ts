export type UserRole = 'client' | 'serveur' | 'barista' | 'cuisinier' | 'gerant' | 'admin' | 'directeur' | 'manager';

export interface AuthenticatedUser {
  id: number;
  username: string;
  role: UserRole;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  createdAt?: Date;
}