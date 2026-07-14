import { Router, json } from 'express'
import rateLimit from 'express-rate-limit'
import { getUsers } from './controllers/GetUsersController'
import { createUser } from './controllers/CreateUserController'
import { updateUser } from './controllers/UpdateUserController'
import { deleteUser } from './controllers/DeleteUserController'
import { login } from './controllers/LoginController'
import { logout } from './controllers/LogoutController'
import { register } from './controllers/RegisterController'
import { listPublicPlans } from './controllers/ListPublicPlansController'
import { captureLead } from './controllers/CaptureLeadController'
import { getSubscriptionStatus } from './controllers/GetSubscriptionStatusController'
import { markSubscriptionAsPaid } from './controllers/MarkSubscriptionAsPaidController'
import { changeSubscriptionPlan } from './controllers/ChangeSubscriptionPlanController'
import { neonLogin, neonRegister, requestPasswordReset, confirmPasswordReset } from './controllers/NeonAuthController'
import { authenticateToken } from '../../middleware/auth'
import { authorizeRoles, enforceEstablishmentScope } from '../../middleware/authorization'
import { ensureSubscriptionAccess } from '../../middleware/subscription'

const router = Router()

// Rate limiting: máx 10 tentativas por IP a cada 15 minutos
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
})

router.post('/login', json(), process.env.NODE_ENV === 'production' ? authLimiter : (req, res, next) => next(), login)
router.post('/register', json(), authLimiter, register)
router.post('/neon/login', json(), authLimiter, neonLogin)
router.post('/neon/register', json(), authLimiter, neonRegister)
router.post('/password/reset-request', json(), authLimiter, requestPasswordReset)
router.post('/password/reset-confirm', json(), authLimiter, confirmPasswordReset)
router.get('/plans/public', listPublicPlans)
router.post('/lead', json(), captureLead)

router.use(authenticateToken)

router.post('/logout', logout)

router.get('/subscription/status', getSubscriptionStatus)
router.post('/subscription/change-plan', authorizeRoles('ADMIN', 'MANAGER'), changeSubscriptionPlan)
router.post('/subscription/mark-paid', authorizeRoles('ADMIN'), markSubscriptionAsPaid)

router.use(ensureSubscriptionAccess)

router.get('/', authorizeRoles('ADMIN', 'MANAGER'), enforceEstablishmentScope('query'), getUsers)
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createUser)
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateUser)
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), deleteUser)

export default router
