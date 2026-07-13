import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, ShieldCheck } from 'lucide-react'
import { authApi, extractApiErrorMessage } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/store/toastStore'

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Token de recuperação inválido o ausente.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await authApi.confirmPasswordReset({ token, newPassword: password })
      toast.success('La contraseña se ha actualizado correctamente.')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(extractApiErrorMessage(err, 'No se pudo actualizar la contraseña.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-6">
        <h1 className="text-2xl font-display font-bold text-white">Recuperar contraseña</h1>
        <p className="text-sm text-gray-400 mt-2">Introduce tu nueva contraseña para continuar.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
            leftIcon={<ShieldCheck className="w-4 h-4" />}
            required
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Actualizar contraseña
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          <Link to="/login" className="text-brand hover:text-brand-light transition-colors">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
