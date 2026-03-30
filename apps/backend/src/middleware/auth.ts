import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../utils/errors'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return secret
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'BARTENDER' | 'CHEF'

interface JwtPayload {
  userId: string
  email: string
  role: UserRole
  establishmentIds: string[]
  iat: number
  exp: number
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    throw new AppError(401, 'Se requiere token de acceso')
  }

  try {
     const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload
    req.user = decoded
    next()
  } catch (error) {
    throw new AppError(403, 'Token inválido o expirado')
  }
}
