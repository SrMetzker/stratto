import { Request, Response, NextFunction } from 'express'
import { addToBlocklist } from '../../../utils/tokenBlocklist'

export const logout = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (token) {
      // Invalida o token pelo tempo restante de vida (24h padrão)
      addToBlocklist(token)
    }

    res.json({ message: 'Logout realizado com sucesso' })
  } catch (error) {
    next(error)
  }
}
