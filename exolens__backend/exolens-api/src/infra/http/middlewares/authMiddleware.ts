import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../../core/errors/AppError';

class UnauthorizedError extends AppError {
  constructor() {
    super('Token JWT inválido ou não fornecido.', 401);
  }
}

interface ITokenPayload {
  id: string;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError();
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as ITokenPayload;

    req.user = {
      id: decoded.id,
    };

    return next();
  } catch (err) {

    throw new UnauthorizedError();
  }
};