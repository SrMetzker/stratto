import { Request, Response, NextFunction } from 'express'
import { UpdateUserService } from '../services/UpdateUserService'
import { AppError, ValidationError } from '../../../utils/errors'

const service = new UpdateUserService()

const normalizeRole = (value: unknown): 'ADMIN' | 'MANAGER' | 'BARTENDER' | 'CHEF' | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined

  const normalized = value.trim().toUpperCase()
  if (normalized === 'ADMIN' || normalized === 'MANAGER' || normalized === 'BARTENDER' || normalized === 'CHEF') {
    return normalized
  }

  throw new ValidationError('Rol inválido. Use ADMIN, MANAGER, BARTENDER o CHEF')
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { email, password, name, role, establishmentIds } = req.body

    let scopedRole = normalizeRole(role)
    let scopedEstablishmentIds = establishmentIds as string[] | undefined

    if (req.user?.role === 'MANAGER') {
      if (role === 'ADMIN' || role === 'MANAGER') {
        throw new AppError(400, '¡Usuario sin permiso para asignar el rol indicado!')
      }

      if (scopedEstablishmentIds) {
        const allowed = new Set(req.user.establishmentIds)
        scopedEstablishmentIds = scopedEstablishmentIds.filter((item) => allowed.has(item))

        if (!scopedEstablishmentIds.length) {
          throw new AppError(400, '¡Vínculo de establecimiento fuera del alcance del usuario!')
        }
      }
    }

    if (!id) {
      throw new ValidationError('¡No fue posible identificar al usuario para actualización!')
    }

    if (!email && !password && !name && !role && !establishmentIds) {
      throw new ValidationError('¡Al menos un campo debe ser proporcionado para la actualización!')
    }

    const updatedUser = await service.execute(
      id as string,
      {
        email: email as string,
        password: password as string,
        name: name as string,
        role: scopedRole,
        establishmentIds: scopedEstablishmentIds
      },
      {
        ...(req.user?.role ? { requesterRole: req.user.role } : {}),
        ...(req.user?.establishmentIds ? { requesterEstablishmentIds: req.user.establishmentIds } : {}),
      }
    )

    res.json(updatedUser)
  } catch (error) {
    next(error)
  }
}
