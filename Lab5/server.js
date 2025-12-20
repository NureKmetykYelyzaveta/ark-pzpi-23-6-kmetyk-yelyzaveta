const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config()

const db = require('./db/db')
const updateActivity = require('./middleware/updateActivity')
const { swaggerUi, swaggerSpec } = require('./swagger/swagger')

const app = express()

// Render/HTTPS: запити приходять через проксі (важливо для req.protocol)
app.set('trust proxy', 1)

app.use(express.json())
app.use(cors())

// -------------------------------
// SWAGGER (без auth)
// -------------------------------
// Віддаємо swagger.json з правильним base URL під поточний домен
app.get('/swagger.json', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`
  res.json({
    ...swaggerSpec,
    servers: [{ url: baseUrl }]
  })
})

// Swagger UI підтягує спеки саме з /swagger.json
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(null, { swaggerOptions: { url: '/swagger.json' } })
)

// -------------------------------
// PUBLIC ROUTES
// -------------------------------
const publicPaths = new Set([
  '/api/users/login',
  '/api/users/register',
  '/',
  '/swagger.json'
])

// -------------------------------
// AUTH MIDDLEWARE
// -------------------------------
function auth(req, res, next) {
  // Пропускаємо публічні шляхи
  if (publicPaths.has(req.path)) return next()

  // Swagger UI і його ассети
  if (req.path.startsWith('/api-docs')) return next()

  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'Token missing' })

  const token = header.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token missing' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET123')

    db.get(
      'SELECT IsBlocked, BlockReason FROM Users WHERE Id=?',
      [decoded.id],
      (err, user) => {
        if (err) {
          console.error('DB error:', err.message)
          return res.status(500).json({ error: 'Database error' })
        }

        if (user && user.IsBlocked) {
          return res.status(403).json({
            error: 'User is blocked',
            reason: user.BlockReason
          })
        }

        req.user = decoded
        next()
      }
    )
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

app.use(auth)

// UPDATE ACTIVITY — тільки для авторизованих
app.use((req, res, next) => {
  if (!req.user) return next()
  return updateActivity(req, res, next)
})

// -------------------------------
// ROUTES
// -------------------------------
app.use('/api/animals', require('./routes/animals'))
app.use('/api/users', require('./routes/users'))
app.use('/api/roles', require('./routes/roles'))

// АЛІАС, щоб Swagger /api/medical працював (бо в swagger.json так записано)
const medicalRecordsRouter = require('./routes/medicalRecords')
app.use('/api/medical', medicalRecordsRouter)
app.use('/api/medical-records', medicalRecordsRouter)

app.use('/api/state-records', require('./routes/stateRecords'))
app.use('/api/treatments', require('./routes/treatments'))
app.use('/api/logs', require('./routes/logs'))
app.use('/api/smart-devices', require('./routes/smartDevices'))
app.use('/api/admin', require('./routes/admin'))

// Root message (можеш замінити на редірект на /api-docs, якщо хочеш)
app.get('/', (req, res) => {
  res.send('Pet Shelter API is running')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
  console.log('Swagger available at /api-docs')
})
