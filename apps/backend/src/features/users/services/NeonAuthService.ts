import { createAuthClient } from '@neondatabase/auth'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../../../config/database'
import { AppError, ValidationError } from '../../../utils/errors'

interface NeonAuthLoginInput {
  email: string
  password: string
}

interface NeonAuthRegisterInput {
  email: string
  password: string
  name: string
  phone?: string
  establishmentName: string
  planCode?: string
}

interface NeonAuthResetRequestInput {
  email: string
}

interface NeonAuthResetConfirmInput {
  token: string
  newPassword: string
}

function isNeonAuthConfigured(): boolean {
  return Boolean(
    process.env.NEON_AUTH_BASE_URL &&
    process.env.NEON_AUTH_COOKIE_SECRET &&
    process.env.NEON_AUTH_URL
  )
}

function getNeonAuthClient() {
  if (!isNeonAuthConfigured()) {
    throw new Error('Neon Auth not configured')
  }

  return createAuthClient(process.env.NEON_AUTH_URL!)
}

function createLocalJwt(user: { id: string; email: string; role: string; establishmentIds: string[] }) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      establishmentIds: user.establishmentIds,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  )
}

async function resolveUserProfile(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
      establishments: {
        include: {
          establishment: {
            include: {
              subscription: {
                include: {
                  plan: {
                    select: {
                      code: true,
                      name: true,
                      priceCents: true,
                      currency: true,
                      billingCycle: true,
                      trialDays: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  return user
}

export class NeonAuthService {
  isConfigured(): boolean {
    return isNeonAuthConfigured()
  }

  async login(input: NeonAuthLoginInput) {
    if (!isNeonAuthConfigured()) {
      throw new AppError(503, 'Neon Auth não está configurado neste ambiente')
    }

    if (!input.email || !input.password) {
      throw new ValidationError('¡El email y la contraseña son obligatorios!')
    }

    const client = getNeonAuthClient()
    const result = await client.signIn.email({
      email: input.email,
      password: input.password,
    })

    const user = await resolveUserProfile(input.email)
    if (!user) {
      throw new AppError(404, 'Usuário não encontrado no banco local')
    }

    const token = createLocalJwt({
      id: user.id,
      email: user.email,
      role: user.role,
      establishmentIds: user.establishments.map((item) => item.establishmentId),
    })

    return {
      user: {
        ...user,
        password: undefined,
      },
      token,
      expiresIn: '24h',
      neonAuth: {
        session: result,
      },
    }
  }

  async register(input: NeonAuthRegisterInput) {
    if (!isNeonAuthConfigured()) {
      throw new AppError(503, 'Neon Auth não está configurado neste ambiente')
    }

    const client = getNeonAuthClient()
    const result = await client.signUp.email({
      email: input.email,
      password: input.password,
      name: input.name,
    })

    const hashedPassword = await bcrypt.hash(input.password, 10)
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: 'MANAGER',
        createdBy: 'neon-auth',
        ...(input.phone ? { phone: input.phone } : {}),
      },
      select: { id: true, email: true, name: true, role: true },
    })

    const establishment = await prisma.establishment.create({
      data: {
        name: input.establishmentName,
        createdBy: user.id,
      },
      select: { id: true, name: true, createdAt: true },
    })

    await prisma.establishmentUser.create({
      data: {
        userId: user.id,
        establishmentId: establishment.id,
      },
    })

    const token = createLocalJwt({
      id: user.id,
      email: user.email,
      role: user.role,
      establishmentIds: [establishment.id],
    })

    return {
      user: {
        ...user,
        establishments: [
          {
            establishmentId: establishment.id,
            establishment,
          },
        ],
      },
      token,
      expiresIn: '24h',
      neonAuth: {
        session: result,
      },
    }
  }

  async requestPasswordReset(input: NeonAuthResetRequestInput) {
    if (!isNeonAuthConfigured()) {
      throw new AppError(503, 'Neon Auth não está configurado neste ambiente')
    }

    if (!input.email) {
      throw new ValidationError('El email es obligatorio')
    }

    const user = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true, email: true } })
    if (!user) {
      return {
        message: 'Si el correo existe, recibirás un enlace para recuperar la contraseña.',
      }
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

    await prisma.$executeRawUnsafe(
      `INSERT INTO "PasswordResetToken" ("id", "userId", "token", "expiresAt", "createdAt") VALUES ($1, $2, $3, $4, $5) ON CONFLICT ("userId") DO UPDATE SET "token" = EXCLUDED."token", "expiresAt" = EXCLUDED."expiresAt", "createdAt" = EXCLUDED."createdAt"`,
      crypto.randomUUID(),
      user.id,
      token,
      expiresAt,
      new Date()
    )

    return {
      message: 'Si el correo existe, recibirás un enlace para recuperar la contraseña.',
      resetToken: token,
    }
  }

  async confirmPasswordReset(input: NeonAuthResetConfirmInput) {
    if (!isNeonAuthConfigured()) {
      throw new AppError(503, 'Neon Auth não está configurado neste ambiente')
    }

    if (!input.token || !input.newPassword) {
      throw new ValidationError('El token y la nueva contraseña son obligatorios')
    }

    const resetTokenRow = await prisma.$queryRaw<Array<{ id: string; userId: string; token: string; expiresAt: Date }>>`
      SELECT "id", "userId", "token", "expiresAt"
      FROM "PasswordResetToken"
      WHERE "token" = ${input.token}
      LIMIT 1
    `

    const resetToken = resetTokenRow[0]
    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new AppError(400, 'El enlace de recuperación ha caducado o es inválido')
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 10)
    await prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } })
    await prisma.$executeRawUnsafe(`DELETE FROM "PasswordResetToken" WHERE "token" = $1`, input.token)

    return {
      message: 'La contraseña se ha actualizado correctamente.',
    }
  }
}
