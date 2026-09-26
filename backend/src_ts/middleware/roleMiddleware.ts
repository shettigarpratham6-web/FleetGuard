import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authMiddleware';

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized. Please login.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden. You don't have permission."
      });
    }

    next();
  };
};

export default authorize;
