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
    interface User {
      id: number;
      email: string;
      role: string;
      permissions: string[];
      name?: string;
      createdAt?: Date;
      updatedAt?: Date;
    }

    interface Request {
      user?: User;
      requestId?: string;
      startTime?: number;
    }

    interface Response {
      success?: boolean;
    }
  }
}

export { AuthenticatedUser };