
import { Request as ExpressRequest } from 'express';
import { AuthenticatedUser as AuthUser } from './auth';

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      role: string;
      permissions: string[];
      name?: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      createdAt?: Date;
      updatedAt?: Date;
      isActive?: boolean;
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

export { AuthUser as AuthenticatedUser };
