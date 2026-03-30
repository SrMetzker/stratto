import { Request, Response, NextFunction } from 'express'
import { UpdateProductService } from '../services/UpdateProductService'
import { AppError, ValidationError } from '../../../utils/errors'

const service = new UpdateProductService()

const VALID_CATEGORIES = new Set([
  'SPIRITS',
  'BEER',
  'WINE',
  'COCKTAILS',
  'SOFT_DRINKS',
  'FOOD',
  'OTHER',
])

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { name, sku, price, category, establishmentId } = req.body

    if (!id) {
      throw new ValidationError('¡No fue posible identificar el producto a actualizar!')
    }

    // Valida se pelo menos um campo foi fornecido
    if (!name && !sku && price === undefined && category === undefined && !establishmentId) {
      throw new ValidationError('¡Al menos un campo debe ser proporcionado para la actualización!')
    }

    if (category !== undefined && !VALID_CATEGORIES.has(String(category))) {
      throw new ValidationError('¡La categoría del producto no es válida!')
    }

    let parsedPrice: number | undefined
    if (price !== undefined) {
      parsedPrice = parseFloat(String(price))
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new ValidationError('¡El precio del producto debe ser un número válido y no puede ser negativo!')
      }
    }

    const updateInput: {
      name?: string
      sku?: string
      price?: number
      category?: 'SPIRITS' | 'BEER' | 'WINE' | 'COCKTAILS' | 'SOFT_DRINKS' | 'FOOD' | 'OTHER'
      establishmentId?: string
    } = {}

    if (name !== undefined) updateInput.name = name
    if (sku !== undefined) updateInput.sku = sku
    if (parsedPrice !== undefined) updateInput.price = parsedPrice
    if (category !== undefined) {
      updateInput.category = category
    }
    if (establishmentId !== undefined) {
      // IDOR: MANAGER e BARTENDER/CHEF não podem mover produto para est. fora do seu escopo
      if (req.user?.role !== 'ADMIN') {
        const allowed = new Set(req.user?.establishmentIds ?? [])
        if (!allowed.has(establishmentId as string)) {
          throw new AppError(403, '¡No tienes permiso para mover el producto a ese establecimiento!')
        }
      }
      updateInput.establishmentId = establishmentId
    }

    const updatedProduct = await service.execute(id as string, updateInput)

    res.json(updatedProduct)
  } catch (error) {
    next(error)
  }
}
