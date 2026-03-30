import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../config/database'
import { InternalServerError, ValidationError } from '../../../utils/errors'
import { ensureDefaultPlans } from './EnsureDefaultPlansService'

interface RegisterInput {
  email: string
  password: string
  name: string
  phone?: string
  establishmentName: string
  planCode?: string
}

export class RegisterService {
  async execute(input: RegisterInput) {
    if (!input.email || !input.password || !input.name || !input.establishmentName) {
      throw new ValidationError('Email, contraseña, nombre y nombre del establecimiento son obligatorios')
    }

    await ensureDefaultPlans()

    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true }
    })

    if (existingUser) {
      throw new ValidationError('Este email ya está en uso')
    }

    const selectedPlan = await prisma.plan.findFirst({
      where: {
        code: input.planCode ?? process.env.DEFAULT_TRIAL_PLAN_CODE ?? 'starter',
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        trialDays: true
      }
    })

    if (!selectedPlan) {
      throw new InternalServerError('Ningún plan de prueba activo fue configurado')
    }

    const hashedPassword = await bcrypt.hash(input.password, 10)
    const now = new Date()
    const trialEndsAt = new Date(now)
    trialEndsAt.setDate(trialEndsAt.getDate() + selectedPlan.trialDays)

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
          ...(input.phone ? { phone: input.phone } : {}),
          role: 'MANAGER',
          createdBy: 'self-signup'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      })

      const establishment = await tx.establishment.create({
        data: {
          name: input.establishmentName,
          createdBy: user.id
        },
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      })

      await tx.establishmentUser.create({
        data: {
          userId: user.id,
          establishmentId: establishment.id
        }
      })

      const subscription = await tx.subscription.create({
        data: {
          establishmentId: establishment.id,
          planId: selectedPlan.id,
          status: 'TRIAL',
          startedAt: now,
          trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndsAt
        },
        select: {
          id: true,
          status: true,
          trialEndsAt: true,
          currentPeriodEnd: true
        }
      })

      return { user, establishment, subscription }
    })

    const token = jwt.sign(
      {
        userId: created.user.id,
        email: created.user.email,
        role: created.user.role,
        establishmentIds: [created.establishment.id]
      },
        process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    return {
      user: {
        ...created.user,
        establishments: [
          {
            establishmentId: created.establishment.id,
            establishment: created.establishment
          }
        ]
      },
      subscription: {
        ...created.subscription,
        plan: {
          code: selectedPlan.code,
          name: selectedPlan.name
        }
      },
      token,
      expiresIn: '24h'
    }
  }
}
