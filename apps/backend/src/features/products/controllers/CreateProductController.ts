import { Request, Response, NextFunction } from 'express'
import { CreateProductService } from '../services/CreateProductService'
import { ValidationError } from '../../../utils/errors'

const service = new CreateProductService()

const VALID_CATEGORIES = new Set([
  'SPIRITS',
  'BEER',
  'WINE',
  'COCKTAILS',
  'SOFT_DRINKS',
  'FOOD',
  'OTHER',
])

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
     const { name, sku, price, category, establishmentId } = req.body
     const createdBy = req.user?.userId

    if (!name) {
      throw new ValidationError('¡El nombre del producto es obligatorio!')
    }

    if (price === undefined) {
      throw new ValidationError('¡El precio del producto es obligatorio!')
    }

    const priceNumber = parseFloat(String(price))
    if (isNaN(priceNumber) || priceNumber < 0) {
      throw new ValidationError('¡El precio del producto debe ser un número válido y no puede ser negativo!')
    }

    if (category !== undefined && !VALID_CATEGORIES.has(String(category))) {
      throw new ValidationError('¡La categoría del producto no es válida!')
    }

    if (!establishmentId) {
      throw new ValidationError('¡El ID del establecimiento es obligatorio!')
    }

    if (!createdBy) {
      throw new ValidationError('¡No fue posible identificar al usuario creador del producto!')
    }

    const product = await service.execute({
      name,
      sku,
      price: priceNumber,
      category,
      establishmentId,
      createdBy
    })

    res.status(201).json(product)
  } catch (error) {
    next(error)
  }
}
