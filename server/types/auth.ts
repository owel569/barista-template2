import type { users } from '../../shared/schema';

export interface UserPayload {
  id: number;
  username: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}
''
// Type dédié pour l'''utilisateur authentifié
export type AuthenticatedUser = {
  id: number;
  username: string;
  role: string;
  tokenVersion?: number;'
} & Partial<Omit<typeof users.$inferSelect, ''id''' | 'username''' | ''role''' | 'password'''>>;

// Note: La déclaration globale de req.user est gérée ailleurs dans le projet''