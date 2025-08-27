import { Request, Response, NextFunction } from 'express';
import { getDb } from '../db';
import { permissions } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

type Capability = 'canView' | 'canCreate' | 'canUpdate' | 'canDelete';

export const requirePermission = (moduleName: string, capability: Capability) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
      return;
    }

    try {
      const db = await getDb();
      const rows = await db.select()
        .from(permissions)
        .where(and(eq(permissions.userId, parseInt(user.id)), eq(permissions.module, moduleName)))
        .limit(1);

      const perm = rows[0];
      if (!perm || !perm[capability]) {
        res.status(403).json({ success: false, message: `Accès refusé: ${moduleName}.${capability}` });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur vérification des permissions' });
    }
  };
};

