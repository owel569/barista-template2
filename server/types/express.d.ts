import { Request as ExpressRequest } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
      };
      requestId?: string;
    }

    interface Response {
      success?: boolean;
    }
  }
}

export {};