const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config()

const db = require('./db/db')
const updateActivity = require('./middleware/updateActivity')
const { swaggerUi, swaggerSpec } = require('./swagger/swagger')

const app = express()
app.use(express.json())
app.use(cors())

// -------------------------------
// PUBLIC ROUTES
// -------------------------------
const publicPaths = new Set([
  '/api/users/login',
  '/api/users/register',
  '/'
])

// -------------------------------
// AUTH MIDDLEWARE
// -------------------------------
function auth(req, res, next) {
  if (publicPaths.has(req.path)) return next()
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

// UPDATE ACTIVITY — only for authenticated users
app.use(updateActivity)

// -------------------------------
// SWAGGER
// -------------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// -------------------------------
// ROUTES
// -------------------------------
app.use('/api/animals', require('./routes/animals'))
app.use('/api/users', require('./routes/users'))
app.use('/api/roles', require('./routes/roles'))
app.use('/api/medical-records', require('./routes/medicalRecords'))
app.use('/api/state-records', require('./routes/stateRecords'))
app.use('/api/treatments', require('./routes/treatments'))
app.use('/api/logs', require('./routes/logs'))
app.use('/api/smart-devices', require('./routes/smartDevices'))
app.use('/api/admin', require('./routes/admin'))

// Root message
app.get('/', (req, res) => {
  res.send('Pet Shelter API is running')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
  console.log('Swagger available at /api-docs')
})
