const express = require('express')
const db = require('../db/db')

const router = express.Router()

function deviceAuth(req, res, next) {
  const key = req.headers['x-device-key']
  if (!key || key !== (process.env.IOT_DEVICE_KEY || 'DEVKEY')) {
    return res.status(401).json({ error: 'Invalid device key' })
  }
  next()
}

function initIoTTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS DeviceTelemetry (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      DeviceGuid TEXT NOT NULL,
      AnimalId INTEGER,
      TempC REAL,
      Motion REAL,
      TempAlert INTEGER DEFAULT 0,
      MotionAlert INTEGER DEFAULT 0,
      CreatedAt TEXT DEFAULT (datetime('now'))
    )
  `)
}

initIoTTables()

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
    'SELECT Id, AnimalId FROM SmartDevices WHERE DeviceGuid = ?',
    [deviceGuid],
    (err, device) => {
      if (err) return res.status(500).json({ error: 'Database error' })
      if (!device) return res.status(404).json({ error: 'Device not registered' })

      db.run(
        `INSERT INTO DeviceTelemetry (DeviceGuid, AnimalId, TempC, Motion, TempAlert, MotionAlert, CreatedAt)
         VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))`,
        [
          deviceGuid,
          device.AnimalId || null,
          Number(tempC ?? null),
          Number(motion ?? null),
          tempAlert ? 1 : 0,
          motionAlert ? 1 : 0,
          ts || null
        ],
        (insErr) => {
          if (insErr) return res.status(500).json({ error: 'Insert failed' })
          res.json({ ok: true })
        }
      )
    }
  )
})

module.exports = router
