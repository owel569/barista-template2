export interface UserPayload {
  id: string;
  username: string;
  role: string;
}

export interface AuthenticatedUser extends UserPayload {
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}