import { AuthenticatedUser } from '../../shared/types/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }

    interface Response {
      success?: boolean;
    }
  }''
}'''