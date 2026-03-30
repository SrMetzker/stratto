import { prisma } from '../../../config/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AppError, ValidationError } from '../../../utils/errors'

interface LoginInput {
  email: string
  password: string
}

export class LoginService {
  async execute(input: LoginInput) {
    if (!input.email || !input.password) {
      throw new ValidationError('¡El email y la contraseña son obligatorios!')
    }

    // Busca usuário por email
    const user = await prisma.user.findUnique({
      where: { email: input.email },
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
                        trialDays: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      throw new AppError(401, 'Credenciales inválidas')
    }

    // Verifica senha
    const isPasswordValid = await bcrypt.compare(input.password, user.password)
    if (!isPasswordValid) {
      throw new AppError(401, 'Credenciales inválidas')
    }

    // Gera token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        establishmentIds: user.establishments.map((item) => item.establishmentId)
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    // Remove senha da resposta
    const { password, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      token,
      expiresIn: '24h'
    }
  }
}
