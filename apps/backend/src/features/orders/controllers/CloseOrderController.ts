import { Request, Response, NextFunction } from 'express'
import { CloseOrderService } from '../services/CloseOrderService'
import { ValidationError } from '../../../utils/errors'

const service = new CloseOrderService()

export const closeOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
      const { allowNegativeStock } = req.body
      const createdBy = req.user?.userId

    if (!id) {
      throw new ValidationError('No fue posible identificar el pedido para finalizar')
    }

    if (!createdBy) {
      throw new ValidationError('createdBy es obligatorio para registrar movimiento de inventario')
    }

      // Apenas ADMIN e MANAGER podem forçar fechamento com estoque negativo
      const canOverrideStock = req.user?.role === 'ADMIN' || req.user?.role === 'MANAGER'

    const order = await service.execute({
      orderId: id as string,
      createdBy,
        allowNegativeStock: canOverrideStock && Boolean(allowNegativeStock),
    })

    res.json(order)
  } catch (error) {
    next(error)
  }
}