import { prisma } from '../../../config/database'
import { NotFoundError, ValidationError } from '../../../utils/errors'

interface OrderItemInput {
  productId: string
  quantity: number
}

interface CreateOrderInput {
  tableId: string
  items: OrderItemInput[]
}

export class CreateOrderService {
  async execute(input: CreateOrderInput) {
    if (!input.tableId) {
      throw new ValidationError(`¡No fue posible identificar el 'tableId' para el pedido!`)
    }

    const table = await prisma.table.findUnique({ where: { id: input.tableId } })
    if (!table) {
      throw new NotFoundError('¡No fue posible encontrar la mesa para el pedido!')
    }

    const productIds = input.items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        recipe: {
          include: {
            items: { include: { ingredient: true } }
          }
        }
      }
    })

    if (products.length !== productIds.length) {
      throw new NotFoundError('Uno o más productos no encontrados')
    }

    // Valida itens e calcula total
    let total = 0

    for (const orderItem of input.items) {
      const product = products.find((p) => p.id === orderItem.productId)
      if (!product) throw new NotFoundError(`Producto ${orderItem.productId} no encontrado`)
      if (!product.recipe) throw new ValidationError(`Producto ${product.name} sin receta configurada`)
      if (orderItem.quantity <= 0) throw new ValidationError('La cantidad del ítem debe ser mayor que cero')

      // Garante que o produto pertence ao mesmo estabelecimento da mesa
      if (product.establishmentId !== table.establishmentId) {
        throw new ValidationError(`Producto ${product.name} no pertenece al establecimiento de esta mesa`)
      }

      total += product.price * orderItem.quantity
    }

    // Cria pedido (baixa de estoque acontece no fechamento)
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          tableId: input.tableId,
          status: 'OPEN',
          total,
          createdAt: new Date()
        }
      })

      const orderItems = input.items.map((item) => ({
        orderId: created.id,
        productId: item.productId,
        quantity: item.quantity,
        price: products.find((p) => p.id === item.productId)?.price || 0
      }))

      await tx.orderItem.createMany({ data: orderItems })

      return created
    })

    return order
  }
}
