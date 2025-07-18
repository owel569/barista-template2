export interface UserPayload {
  id: number;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface AuthenticatedUser extends UserPayload {
  iat: number;
  exp: number;
}

// Extending Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}