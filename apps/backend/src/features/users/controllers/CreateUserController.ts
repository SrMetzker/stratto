import { Request, Response, NextFunction } from 'express'
import { CreateUserService } from '../services/CreateUserService'
import { AppError, ValidationError } from '../../../utils/errors'

const service = new CreateUserService()

const normalizeRole = (value: unknown): 'ADMIN' | 'MANAGER' | 'BARTENDER' | 'CHEF' | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined

  const normalized = value.trim().toUpperCase()
  if (normalized === 'ADMIN' || normalized === 'MANAGER' || normalized === 'BARTENDER' || normalized === 'CHEF') {
    return normalized
  }

  throw new ValidationError('Rol inválido. Use ADMIN, MANAGER, BARTENDER o CHEF')
}

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
  const { email, password, name, role, establishmentIds } = req.body
  const createdBy = req.user?.userId

    let scopedRole = normalizeRole(role)
    let scopedEstablishmentIds = establishmentIds as string[] | undefined

    if (req.user?.role === 'MANAGER') {
      if (role === 'ADMIN' || role === 'MANAGER') {
        throw new AppError(400, '¡Usuario sin permiso para asignar el rol indicado!')
      }

      const allowed = new Set(req.user.establishmentIds)
      scopedEstablishmentIds = (establishmentIds as string[] | undefined)?.length
        ? (establishmentIds as string[]).filter((id) => allowed.has(id))
        : [...allowed]

      if (!scopedEstablishmentIds.length) {
        throw new AppError(400, '¡El usuario debe estar vinculado a al menos un establecimiento!')
      }

      scopedRole = role ?? 'BARTENDER'
    }

    if (!email) {
      throw new ValidationError('¡El email es obligatorio!')
    }
    if (!password) {
      throw new ValidationError('¡La contraseña es obligatoria!')
    }
    if (!name) {
      throw new ValidationError('¡El nombre es obligatorio!')
    }
    if (!createdBy) {
      throw new ValidationError('¡No fue posible identificar al usuario creador del nuevo usuario!')
    }

    const user = await service.execute({
      email: email as string,
      password: password as string,
      name: name as string,
      role: scopedRole,
      establishmentIds: scopedEstablishmentIds,
      createdBy: createdBy as string
    })

    res.status(201).json(user)
  } catch (error) {
    next(error)
  }
}
