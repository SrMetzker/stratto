import { Request, Response, NextFunction } from 'express'
import { DeleteUserService } from '../services/DeleteUserService'
import { ValidationError } from '../../../utils/errors'
import type { UserRole } from '../../../middleware/auth'

const service = new DeleteUserService()

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    if (!id) {
      throw new ValidationError('¡El ID del usuario es obligatorio!')
    }

    const requesterRole = req.user?.role
    const requesterEstablishmentIds = req.user?.establishmentIds
    const result = await service.execute(id as string, {
      ...(requesterRole ? { requesterRole: requesterRole as UserRole } : {}),
      ...(requesterEstablishmentIds ? { requesterEstablishmentIds } : {})
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
}
