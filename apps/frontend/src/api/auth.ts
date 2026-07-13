import axios from 'axios'
import type { AuthResponse, LoginCredentials, PublicPlan, RegisterPayload, User } from '@/types'

interface PasswordResetRequestPayload {
  email: string
}

interface PasswordResetConfirmPayload {
  token: string
  newPassword: string
}
import apiClient from '@/api/client'
import { normalizeRole } from '@/utils/rbac'

type AuthPayload = AuthResponse | { data: AuthResponse }

const toUser = (value: unknown): User => {
  const fallback: User = {
    id: '',
    name: '',
    email: '',
    role: 'bartender',
    establishments: [],
  }

  if (!value || typeof value !== 'object') return fallback

  const v = value as Record<string, unknown>
  const normalizedRole = normalizeRole(v.role) ?? 'bartender'

  const rawEstablishments = Array.isArray(v.establishments) ? v.establishments : []
  const establishments = rawEstablishments
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const establishmentLink = item as Record<string, unknown>
      const nested = establishmentLink.establishment
      const establishment = nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : null

      return {
        id: typeof establishmentLink.id === 'string' ? establishmentLink.id : '',
        userId: typeof establishmentLink.userId === 'string' ? establishmentLink.userId : '',
        establishmentId:
          typeof establishmentLink.establishmentId === 'string' ? establishmentLink.establishmentId : '',
        establishment: establishment
          ? {
              id: typeof establishment.id === 'string' ? establishment.id : '',
              name: typeof establishment.name === 'string' ? establishment.name : '',
              createdAt: typeof establishment.createdAt === 'string' ? establishment.createdAt : '',
              createdBy: typeof establishment.createdBy === 'string' ? establishment.createdBy : '',
            }
          : undefined,
      }
    })

  return {
    id: typeof v.id === 'string' ? v.id : fallback.id,
    name: typeof v.name === 'string' ? v.name : fallback.name,
    email: typeof v.email === 'string' ? v.email : fallback.email,
    role: normalizedRole,
    establishments,
  }
}

const toAuthResponse = (payload: unknown): AuthResponse => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid authentication response')
  }

  const value = payload as AuthPayload
  const source = 'data' in value && value.data ? value.data : value

  if (!source || typeof source !== 'object') {
    throw new Error('Invalid authentication response')
  }

  const data = source as Record<string, unknown>
  const token = typeof data.token === 'string' ? data.token : ''
  if (!token) {
    throw new Error('Authentication token not found in response')
  }

  return {
    token,
    user: toUser(data.user),
    expiresIn: typeof data.expiresIn === 'string' ? data.expiresIn : undefined,
  }
}

export const extractApiErrorMessage = (
  error: unknown,
  fallback = 'Ocorreu um erro. Tente novamente.'
): string => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data
    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData
    }

    if (responseData && typeof responseData === 'object') {
      const data = responseData as Record<string, unknown>
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message
      }
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error
      }
    }

    if (error.message) return error.message
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthPayload>('/users/login', credentials)
    return toAuthResponse(response.data)
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthPayload>('/users/register', payload)
    return toAuthResponse(response.data)
  },

  captureLead: async (payload: {
    name: string
    email: string
    phone?: string
    establishmentName: string
  }): Promise<void> => {
    await apiClient.post('/users/lead', payload)
  },

  getPublicPlans: async (): Promise<PublicPlan[]> => {
    const response = await apiClient.get<PublicPlan[]>('/users/plans/public')
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/users/logout')
  },

  requestPasswordReset: async (payload: PasswordResetRequestPayload): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/users/password/reset-request', payload)
    return response.data
  },

  confirmPasswordReset: async (payload: PasswordResetConfirmPayload): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/users/password/reset-confirm', payload)
    return response.data
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User[]>('/users')
    return toUser(response.data[0])
  },
}
