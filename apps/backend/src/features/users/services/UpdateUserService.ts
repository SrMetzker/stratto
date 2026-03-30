import { prisma } from '../../../config/database'
import { AppError, InternalServerError, NotFoundError } from '../../../utils/errors'
import bcrypt from 'bcryptjs'
import type { UserRole } from '../../../middleware/auth'

interface UpdateUserInput {
  email?: string
  password?: string
  name?: string
  role?: 'ADMIN' | 'MANAGER' | 'BARTENDER' | 'CHEF' | undefined
  establishmentIds?: string[] | undefined
}

interface UpdateUserContext {
  requesterRole?: UserRole
  requesterEstablishmentIds?: string[]
}

export class UpdateUserService {
  async execute(userId: string, input: UpdateUserInput, ctx?: UpdateUserContext) {
    // Verifica se o usuário existe (com vínculos para checar escopo IDOR)
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { establishments: { select: { establishmentId: true } } }
    })

    if (!existingUser) {
      throw new NotFoundError('¡No fue posible identificar al usuario para actualización!')
    }

    // IDOR: MANAGER só pode atualizar usuários do seu próprio estabelecimento
    if (ctx?.requesterRole === 'MANAGER') {
      const targetEstIds = existingUser.establishments.map((e) => e.establishmentId)
      const hasOverlap = targetEstIds.some((id) => ctx.requesterEstablishmentIds?.includes(id))
      if (!hasOverlap) {
        throw new AppError(403, '¡No tienes permiso para modificar este usuario!')
      }
    }

    // Se a senha for fornecida, faz hash dela
    let hashedPassword: string
    if (input.password) {
      hashedPassword = await bcrypt.hash(input.password, 10)
    }

    // Atualiza apenas os campos fornecidos
    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(input.email && { email: input.email }),
          ...(hashedPassword && { password: hashedPassword }),
          ...(input.name && { name: input.name }),
          ...(input.role && { role: input.role })
        }
      })

      if (input.establishmentIds) {
        await tx.establishmentUser.deleteMany({ where: { userId } })
        if (input.establishmentIds.length > 0) {
          await tx.establishmentUser.createMany({
            data: input.establishmentIds.map((establishmentId) => ({
              userId,
              establishmentId
            })),
            skipDuplicates: true
          })
        }
      }

      return tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          createdBy: true,
          establishments: {
            include: {
              establishment: true
            }
          }
        }
      })
    })

    if (!updatedUser) {
      throw new InternalServerError('Error al actualizar usuario')
    }

    return updatedUser
  }
}
