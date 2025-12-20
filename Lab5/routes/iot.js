const express = require('express')
const db = require('../db/db')

const router = express.Router()

function deviceAuth(req, res, next) {
  const key = req.headers['x-device-key']
  const expected = process.env.IOT_DEVICE_KEY || 'DEVKEY'
  if (!key || key !== expected) {
    return res.status(401).json({ error: 'Invalid device key' })
  }
  next()
}

db.run(`
  CREATE TABLE IF NOT EXISTS DeviceTelemetry (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    DeviceGuid TEXT NOT NULL,
    DogId INTEGER,
    TempC REAL,
    Motion REAL,
    TempAlert INTEGER DEFAULT 0,
    MotionAlert INTEGER DEFAULT 0,
    CreatedAt TEXT DEFAULT (datetime('now'))
  )
`)

router.post('/telemetry', deviceAuth, (req, res) => {
  const {
    deviceGuid,
    tempC,
    motion,
    tempAlert,
    motionAlert,
    ts
  } = req.body || {}

  if (!deviceGuid) {
    return res.status(400).json({ error: 'deviceGuid is required' })
  }

  db.get(
    'SELECT Id, DogId FROM SmartDevices WHERE DeviceGuid = ?',
    [deviceGuid],
    (err, device) => {
      if (err) {
        console.error('DB error:', err.message)
        return res.status(500).json({ error: 'Database error' })
      }
      if (!device) {
        return res.status(404).json({ error: 'Device not registered' })
      }

      db.run(
        `INSERT INTO DeviceTelemetry
          (DeviceGuid, DogId, TempC, Motion, TempAlert, MotionAlert, CreatedAt)
         VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))`,
        [
          deviceGuid,
          device.DogId || null,
          Number.isFinite(Number(tempC)) ? Number(tempC) : null,
          Number.isFinite(Number(motion)) ? Number(motion) : null,
          tempAlert ? 1 : 0,
          motionAlert ? 1 : 0,
          ts || null
        ],
        function (insErr) {
          if (insErr) {
            console.error('Insert error:', insErr.message)
            return res.status(500).json({ error: 'Insert failed' })
          }
          res.json({ ok: true, telemetryId: this.lastID, dogId: device.DogId })
        }
      )
    }
  )
})

router.get('/telemetry/latest', deviceAuth, (req, res) => {
  const { deviceGuid } = req.query
  if (!deviceGuid) return res.status(400).json({ error: 'deviceGuid is required' })

  db.get(
    `SELECT * FROM DeviceTelemetry
     WHERE DeviceGuid = ?
     ORDER BY Id DESC
     LIMIT 1`,
    [deviceGuid],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' })
      res.json(row || null)
    }
  )
})

router.get('/telemetry', deviceAuth, (req, res) => {
  const { deviceGuid, limit } = req.query
  if (!deviceGuid) return res.status(400).json({ error: 'deviceGuid is required' })

  const lim = Math.max(1, Math.min(Number(limit || 20), 200))

  db.all(
    `SELECT * FROM DeviceTelemetry
     WHERE DeviceGuid = ?
     ORDER BY Id DESC
     LIMIT ?`,
    [deviceGuid, lim],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' })
      res.json(rows || [])
    }
  )
})

module.exports = router
