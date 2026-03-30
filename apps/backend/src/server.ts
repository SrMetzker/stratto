import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from 'dotenv'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/errorHandler'
import { authenticateToken } from './middleware/auth'
import { ensureSubscriptionAccess } from './middleware/subscription'
import establishmentsRoutes from './features/establishments/routes'
import productsRoutes from './features/products/routes'
import usersRoutes from './features/users/routes'
import stockRoutes from './features/stock/routes'
import ordersRoutes from './features/orders/routes'
import recipesRoutes from './features/recipes/routes'

// Carrega variáveis de ambiente antes de tudo
config()

// Validação de variáveis obrigatórias no startup — falha rápido e explícito
const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'] as const
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`)
  }
}

const port: number = Number(process.env.PORT) || 3000;
const app = express()

// Middlewares
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) ?? [],
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))

// Routes
app.use('/establishments', authenticateToken, ensureSubscriptionAccess, establishmentsRoutes)
app.use('/products', authenticateToken, ensureSubscriptionAccess, productsRoutes)
app.use('/stock', authenticateToken, ensureSubscriptionAccess, stockRoutes)
app.use('/orders', authenticateToken, ensureSubscriptionAccess, ordersRoutes)
app.use('/recipes', authenticateToken, ensureSubscriptionAccess, recipesRoutes)
app.use('/users', usersRoutes) // Login não precisa de auth

// Error handling
app.use(errorHandler)

// 404
app.use((req, res) => {
  res.status(404).json({ error: '¡No fue posible encontrar la ruta solicitada!' })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`)
})
