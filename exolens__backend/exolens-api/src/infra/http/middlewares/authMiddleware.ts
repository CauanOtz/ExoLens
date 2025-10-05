import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, UnauthorizedError } from '../../../core/errors/AppError';

interface TokenPayload {
  id: string;
  iat: number;
  exp: number;
}

function getTokenFromHeaders(req: Request): string | null {
  const { authorization } = req.headers;

  if (!authorization) {
    return null;
  }

  const parts = authorization.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromHeaders(req);

  if (!token) {
    return next(new UnauthorizedError('Token not provided or malformed.'));
  }


  try {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables.');
      return next(new AppError('Internal server configuration error.', 500));
    }

    const decoded = jwt.verify(token, jwtSecret);
    const { id } = decoded as TokenPayload;

    req.user = { id };

    return next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid token.'));
  }
}