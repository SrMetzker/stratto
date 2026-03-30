import { Request, Response, NextFunction } from 'express'
import { CreateEstablishmentService } from '../services/CreateEstablishmentService'
import { ValidationError } from '../../../utils/errors'

const service = new CreateEstablishmentService()

export const createEstablishment = async (req: Request, res: Response, next: NextFunction) => {
  try {
     const { name } = req.body
     const createdBy = req.user?.userId

    if (!name) {
      throw new ValidationError('¡El nombre del establecimiento es obligatorio!')
    }
    if (!createdBy) {
      throw new ValidationError('¡No fue posible identificar al usuario creador del establecimiento!')
    }

    const establishment = await service.execute({ name, createdBy })

    res.json(establishment)
  } catch (error) {
    next(error)
  }
}
