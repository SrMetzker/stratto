import React, { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { authApi, extractApiErrorMessage } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/store/toastStore'
import { getDefaultRouteForRole } from '@/utils/rbac'
import { ContactBar } from '@/components/ui/ContactBar'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const defaultRoute = getDefaultRouteForRole(user?.role)

  if (isAuthenticated && defaultRoute !== '/login') return <Navigate to={defaultRoute} replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user, token } = await authApi.login({ email, password })
      login(user, token)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(getDefaultRouteForRole(user.role), { replace: true })
    } catch (error) {
      setError(extractApiErrorMessage(error, 'Invalid email or password'))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Introduce tu correo para recuperar la contraseña.')
      return
    }

    setError('')
    setLoading(true)
    try {
      await authApi.requestPasswordReset({ email: email.trim() })
      setResetSent(true)
      toast.success('Si el correo existe, recibirás instrucciones para recuperar tu contraseña.')
    } catch (error) {
      setError(extractApiErrorMessage(error, 'No se pudo enviar la solicitud.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/3 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Branding above the form card, with logo next to title and slogan */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <img src="/logo.png" alt="Stratto" className="w-20 h-20 object-contain" />
          <div className="text-left">
            <h1 className="text-3xl font-display font-bold text-white leading-none">Stratto</h1>
            <p className="text-gray-400 text-xs mt-2 max-w-[210px]">
              Controla tu stock sin pérdidas.
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-bold text-white text-xl mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pointer-events-auto text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {resetSent && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <p className="text-green-400 text-sm font-medium">Revisa tu correo para continuar con la recuperación.</p>
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              Sign in
            </Button>
          </form>
        </div>

        <div className="text-center text-xs text-gray-400 mt-4 space-y-2">
          <button
            type="button"
            onClick={() => void handleForgotPassword()}
            className="text-brand hover:text-brand-light transition-colors block mx-auto"
          >
            Forgot your password?
          </button>
          <p>
            Don't have an account yet?{' '}
            <Link to="/register" className="text-brand hover:text-brand-light transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        <ContactBar
          email="sr.metzker.lucas@gmail.com"
          whatsapp="34624250681"
          whatsappMessage="¡Hola! Necesito ayuda con Stratto."
        />
      </div>
    </div>
  )
}
