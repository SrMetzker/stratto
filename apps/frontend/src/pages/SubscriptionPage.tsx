import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CircleDollarSign, CreditCard, Store } from 'lucide-react'
import { subscriptionApi } from '@/api/subscription'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useEstablishments } from '@/hooks'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import type { PublicPlan, SubscriptionStatusResponse } from '@/types'

const statusLabel: Record<SubscriptionStatusResponse['status'], string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  CANCELLED: 'Cancelled',
}

const statusBadge: Record<SubscriptionStatusResponse['status'], string> = {
  TRIAL: 'badge-amber',
  ACTIVE: 'badge-green',
  SUSPENDED: 'badge-red',
  CANCELLED: 'badge-red',
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value))
}

const formatPrice = (priceCents: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(priceCents / 100)
}

export const SubscriptionPage: React.FC = () => {
  const { user, activeEstablishmentId, setActiveEstablishmentId } = useAuthStore()
  const { data: liveEstablishments } = useEstablishments()
  const [loading, setLoading] = useState(false)
  const [submittingManual, setSubmittingManual] = useState(false)
  const [submittingPlan, setSubmittingPlan] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null)
  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [selectedPlanCode, setSelectedPlanCode] = useState('')
  const [providerReference, setProviderReference] = useState('')
  const [amountCents, setAmountCents] = useState('')

  const isAdmin = user?.role === 'admin'
  const establishments = isAdmin
    ? (liveEstablishments ?? []).map((item) => ({
        id: item.id,
        establishmentId: item.id,
        establishment: { name: item.name },
      }))
    : (user?.establishments ?? [])

  const establishmentId = useMemo(() => {
    return activeEstablishmentId ?? establishments[0]?.establishmentId
  }, [activeEstablishmentId, establishments])

  const loadStatus = async (targetEstablishmentId?: string) => {
    setLoading(true)
    setError('')
    try {
      const data = await subscriptionApi.getStatus(targetEstablishmentId)
      setStatus(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load subscription'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (establishmentId) {
      void loadStatus(establishmentId)
    }
  }, [establishmentId])

  useEffect(() => {
    let cancelled = false

    const loadPlans = async () => {
      setLoadingPlans(true)
      try {
        const data = await authApi.getPublicPlans()
        if (!cancelled) {
          setPlans(data)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load plans'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setLoadingPlans(false)
        }
      }
    }

    void loadPlans()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (status?.plan?.code) {
      setSelectedPlanCode(status.plan.code)
    }
  }, [status?.plan?.code])

  const handleChangePlan = async () => {
    if (!establishmentId || !selectedPlanCode) return

    setSubmittingPlan(true)
    setError('')
    try {
      const next = await subscriptionApi.changePlan({
        establishmentId,
        planCode: selectedPlanCode,
      })
      setStatus(next)
      toast.success('Plan updated successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change plan'
      setError(message)
      toast.error(message)
    } finally {
      setSubmittingPlan(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!establishmentId) return

    setSubmittingManual(true)
    setError('')
    try {
      const amount = Number(amountCents)
      const next = await subscriptionApi.markAsPaid({
        establishmentId,
        providerReference: providerReference.trim() || undefined,
        amountCents: Number.isFinite(amount) && amount > 0 ? amount : undefined,
      })
      setStatus(next)
      toast.success('Manual payment recorded. Subscription activated!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record payment'
      setError(message)
      toast.error(message)
    } finally {
      setSubmittingManual(false)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Subscription</h1>
          <p className="text-sm text-gray-400 mt-1">Manage trial and manual activation without a gateway</p>
        </div>
      </div>

      <div className="card p-4 md:p-6 space-y-4">
        <p className="label">Establishment</p>
        <Select
          options={establishments.map((item) => ({
            value: item.establishmentId,
            label: item.establishment?.name ?? item.establishmentId,
          }))}
          value={establishmentId ?? ''}
          onChange={(e) => setActiveEstablishmentId(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="card p-6 text-sm text-gray-300">Loading subscription...</div>
      ) : status ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="label">Status</p>
              <div className={`${statusBadge[status.status]} w-fit`}>{statusLabel[status.status]}</div>
            </div>

            <div className="stat-card">
              <p className="label">Plan</p>
              <p className="text-white font-display font-semibold">{status.plan.name}</p>
              <p className="text-xs text-gray-400">{status.plan.code}</p>
            </div>

            <div className="stat-card">
              <p className="label">Price</p>
              <p className="text-white font-display font-semibold">
                {formatPrice(status.plan.priceCents, status.plan.currency)}
              </p>
              <p className="text-xs text-gray-400">{status.plan.billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'}</p>
            </div>

            <div className="stat-card">
              <p className="label">Establishment</p>
              <p className="text-white font-display font-semibold">{status.establishment.name}</p>
              <p className="text-xs text-gray-400 truncate">{status.establishment.id}</p>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2' : ''} gap-4`}>
            <div className="card p-5 space-y-3">
              <p className="label">Important Dates</p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  Trial ends on: <strong>{formatDate(status.trialEndsAt)}</strong>
                </p>
                <p className="text-gray-300 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  Current period until: <strong>{formatDate(status.currentPeriodEnd)}</strong>
                </p>
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <p className="label">Subscription Plan</p>
              <p className="text-sm text-gray-400">
                Only the administrator can change the establishment plan.
              </p>

              <Select
                label="Select plan"
                value={selectedPlanCode}
                disabled={!isAdmin}
                onChange={(event) => setSelectedPlanCode(event.target.value)}
                options={plans.map((plan) => ({
                  value: plan.code,
                  label: `${plan.name} • ${formatPrice(plan.priceCents, plan.currency)}/${plan.billingCycle === 'YEARLY' ? 'yr' : 'mo'}`,
                }))}
              />

              <Button
                onClick={handleChangePlan}
                loading={submittingPlan || loadingPlans}
                disabled={!selectedPlanCode || selectedPlanCode === status.plan.code}
              >
                Update plan
              </Button>
            </div>

            {isAdmin && (
              <div className="card p-5 space-y-3">
                <p className="label">Manual Activation</p>
                <p className="text-sm text-gray-400">
                  Use this when the customer pays by bank transfer, MB Way, Bizum or cash.
                </p>

                <Input
                  label="Payment reference (optional)"
                  value={providerReference}
                  onChange={(e) => setProviderReference(e.target.value)}
                  placeholder="e.g. transfer 2026-03-16"
                  leftIcon={<CreditCard className="w-4 h-4" />}
                />

                <Input
                  label="Amount in cents (optional)"
                  value={amountCents}
                  onChange={(e) => setAmountCents(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={`suggestion: ${status.plan.priceCents}`}
                  leftIcon={<CircleDollarSign className="w-4 h-4" />}
                />

                <Button
                  onClick={handleMarkPaid}
                  loading={submittingManual}
                  icon={<Store className="w-4 h-4" />}
                >
                  Mark as paid and activate
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card p-6 text-sm text-gray-300">No subscription found for this establishment.</div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}
