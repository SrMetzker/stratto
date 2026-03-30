import { Request, Response, NextFunction } from 'express'
import { CreateIngredientService } from '../services/CreateIngredientService'
import { ValidationError } from '../../../utils/errors'

const service = new CreateIngredientService()

export const createIngredient = async (req: Request, res: Response, next: NextFunction) => {
  try {
     const { name, unit, currentStock, minimumStock, establishmentId } = req.body
     const createdBy = req.user?.userId

    if (!name || !unit || currentStock === undefined || !establishmentId || !createdBy) {
      throw new ValidationError('name, unit, currentStock, establishmentId y createdBy son obligatorios')
    }

    const ingredient = await service.execute({
      name,
      unit,
      currentStock,
      minimumStock,
      establishmentId,
      createdBy
    })

    res.status(201).json(ingredient)
  } catch (error) {
    next(error)
  }
}
