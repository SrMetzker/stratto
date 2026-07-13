import { Request, Response, NextFunction } from 'express'
import { NeonAuthService } from '../services/NeonAuthService'

const service = new NeonAuthService()

export const neonLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.login(req.body)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const neonRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.register(req.body)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.requestPasswordReset(req.body)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export const confirmPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.confirmPasswordReset(req.body)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
