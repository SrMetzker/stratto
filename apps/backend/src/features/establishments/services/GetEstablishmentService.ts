import { prisma } from '../../../config/database'

export class GetEstablishmentService {
  async execute(userId?: string, role?: 'ADMIN' | 'MANAGER' | 'BARTENDER' | 'CHEF') {
    if (role !== 'ADMIN' && !userId) {
      return []
    }

    const where = role === 'ADMIN' || !userId
      ? {}
      : {
          users: {
            some: {
              userId
            }
          }
        }

    const establishments = await prisma.establishment.findMany({
      where,
      include: {
        products: true
      }
    })

    return establishments
  }
}
