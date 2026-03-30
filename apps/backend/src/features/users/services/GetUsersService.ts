import { prisma } from '../../../config/database'
import type { UserRole } from '../../../middleware/auth'

interface GetUsersInput {
  establishmentId?: string
  requesterRole?: UserRole | undefined
  requesterEstablishmentIds?: string[]
}

export class GetUsersService {
  async execute(input?: GetUsersInput) {
    const where: any = {}

    if (input?.establishmentId) {
      where.establishments = {
        some: {
          establishmentId: input.establishmentId
        }
      }
    }

    if (input?.requesterRole !== 'ADMIN') {
      where.role = {
        not: 'ADMIN'
      }

      // Restringe usuários aos estabelecimentos que o requisitante pode acessar.
      if (input?.establishmentId) {
        where.establishments = {
          some: {
            establishmentId: input.establishmentId
          }
        }
      } else {
        const allowedEstablishments = input?.requesterEstablishmentIds ?? []
        if (!allowedEstablishments.length) {
          return []
        }

        where.establishments = {
          some: {
            establishmentId: {
              in: allowedEstablishments
            }
          }
        }
      }
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        createdBy: true,
        establishments: {
          ...(input?.requesterRole !== 'ADMIN'
            ? {
                where: {
                  establishmentId: {
                    in: input?.requesterEstablishmentIds ?? []
                  }
                }
              }
            : {}),
          include: {
            establishment: true
          }
        }
      },
      where,
      orderBy: { createdAt: 'desc' }
    })

    return users
  }
}
