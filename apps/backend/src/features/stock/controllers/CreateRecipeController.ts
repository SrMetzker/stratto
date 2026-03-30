import { Request, Response, NextFunction } from 'express'
import { CreateRecipeService } from '../services/CreateRecipeService'
import { ValidationError } from '../../../utils/errors'

const service = new CreateRecipeService()

export const createRecipe = async (req: Request, res: Response, next: NextFunction) => {
  try {
     const { productId, items } = req.body
     const createdBy = req.user?.userId

    if (!productId) {
      throw new ValidationError('¡El productId es obligatorio!')
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new ValidationError('¡Los ítems de la receta son obligatorios!')
    }

    if (!createdBy) {
      throw new ValidationError('¡No fue posible identificar al usuario creador de la receta!')
    }

    const recipe = await service.execute({
      productId,
      items,
      createdBy
    })

    res.status(201).json(recipe)

  } catch (error) {
    next(error)
  }
}
