import apiClient from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import type { User, UserCreateInput, UserUpdateInput } from '@/types'

type BackendRole = 'ADMIN' | 'MANAGER' | 'BARTENDER' | 'CHEF'

type BackendUser = {
  id: string
  name: string
  email: string
  role: BackendRole
  createdAt: string
  createdBy: string
  establishments?: Array<{
    id: string
    userId: string
    establishmentId: string
    establishment?: {
      id: string
      name: string
      createdAt: string
      createdBy: string
    }
  }>
}

const ROLE_MAP: Record<BackendRole, NonNullable<User['role']>> = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  BARTENDER: 'bartender',
  CHEF: 'chef',
}

const ROLE_MAP_UP: Record<NonNullable<User['role']>, BackendRole> = {
  admin: 'ADMIN',
  manager: 'MANAGER',
  bartender: 'BARTENDER',
  chef: 'CHEF',
}

const mapUser = (user: BackendUser): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role ? ROLE_MAP[user.role] : undefined,
  createdAt: user.createdAt,
  createdBy: user.createdBy,
  establishments: user.establishments,
})

const getContext = () => {
  const { activeEstablishmentId, user } = useAuthStore.getState()
  return {
    establishmentId: activeEstablishmentId,
    role: user?.role,
    createdBy: user?.id,
  }
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { establishmentId, role } = getContext()
    const response = await apiClient.get<BackendUser[]>('/users', {
      params: {
        establishmentId: role !== 'admin' ? establishmentId ?? undefined : undefined,
      },
    })

    return response.data.map(mapUser)
  },

  create: async (data: UserCreateInput): Promise<User> => {
    const { createdBy, establishmentId, role } = getContext()
    if (!createdBy) throw new Error('User not authenticated')

    const payload: Record<string, unknown> = {
      ...data,
      role: data.role ? ROLE_MAP_UP[data.role] : undefined,
      establishmentIds: data.establishmentIds,
      createdBy,
    }

    if (!data.establishmentIds?.length && establishmentId && role !== 'admin') {
      payload.establishmentId = establishmentId
      payload.establishmentIds = [establishmentId]
    }

    const response = await apiClient.post<BackendUser>('/users', payload)

    return mapUser(response.data)
  },

  update: async (id: string, data: UserUpdateInput): Promise<User> => {
    const response = await apiClient.put<BackendUser>(`/users/${id}`, {
      ...data,
      role: data.role ? ROLE_MAP_UP[data.role] : undefined,
    })
    return mapUser(response.data)
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },
}
