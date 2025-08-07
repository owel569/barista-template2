import { Request as ExpressRequest } from 'express';

interface AuthenticatedUser {
  id: number;
  username: string;
  role: 'directeur' | 'employe' | 'admin';
  firstName?: string;
  lastName?: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }

    interface Response {
      success?: boolean;
    }
  }
}

export { AuthenticatedUser };