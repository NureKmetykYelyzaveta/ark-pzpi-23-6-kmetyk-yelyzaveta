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

/**
 * @swagger
 * tags:
 *   - name: IoT
 *     description: Телеметрія з розумних пристроїв (IoT)
 *
 * components:
 *   schemas:
 *     TelemetryIn:
 *       type: object
 *       required:
 *         - deviceGuid
 *       properties:
 *         deviceGuid:
 *           type: string
 *           example: "DEV-001"
 *         tempC:
 *           type: number
 *           nullable: true
 *           example: 23.5
 *         motion:
 *           type: number
 *           nullable: true
 *           example: 1.2
 *         tempAlert:
 *           type: boolean
 *           example: false
 *         motionAlert:
 *           type: boolean
 *           example: false
 *         ts:
 *           type: string
 *           description: ISO timestamp (необов'язково). Якщо не передано, ставиться поточний час.
 *           example: "2025-12-21T04:02:46Z"
 *
 *     TelemetryRow:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *           example: 101
 *         DeviceGuid:
 *           type: string
 *           example: "DEV-001"
 *         DogId:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         TempC:
 *           type: number
 *           nullable: true
 *           example: 23.5
 *         Motion:
 *           type: number
 *           nullable: true
 *           example: 1.2
 *         TempAlert:
 *           type: integer
 *           example: 0
 *         MotionAlert:
 *           type: integer
 *           example: 0
 *         CreatedAt:
 *           type: string
 *           example: "2025-12-21 04:02:46"
 *
 *     TelemetryOk:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           example: true
 *         telemetryId:
 *           type: integer
 *           example: 101
 *         dogId:
 *           type: integer
 *           nullable: true
 *           example: 1
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Invalid device key"
 */

/**
 * @swagger
 * /api/iot/telemetry:
 *   post:
 *     summary: Надіслати телеметрію з пристрою
 *     tags: [IoT]
 *     security:
 *       - deviceKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/TelemetryIn"
 *     responses:
 *       200:
 *         description: Телеметрію збережено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/TelemetryOk"
 *       400:
 *         description: Некоректний запит (наприклад, немає deviceGuid)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Невірний ключ пристрою (X-Device-Key)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       404:
 *         description: Пристрій не зареєстровано (DeviceGuid відсутній у SmartDevices)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Помилка БД/вставки
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.post('/telemetry', deviceAuth, (req, res) => {
  const { deviceGuid, tempC, motion, tempAlert, motionAlert, ts } = req.body || {}

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

/**
 * @swagger
 * /api/iot/telemetry/latest:
 *   get:
 *     summary: Отримати останній запис телеметрії для пристрою
 *     tags: [IoT]
 *     security:
 *       - deviceKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceGuid
 *         required: true
 *         schema:
 *           type: string
 *         example: "DEV-001"
 *     responses:
 *       200:
 *         description: Останній запис або null
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: "#/components/schemas/TelemetryRow"
 *                 - type: "null"
 *       400:
 *         description: Не передано deviceGuid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Невірний X-Device-Key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Помилка БД
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
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

/**
 * @swagger
 * /api/iot/telemetry:
 *   get:
 *     summary: Отримати список телеметрії для пристрою
 *     tags: [IoT]
 *     security:
 *       - deviceKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: deviceGuid
 *         required: true
 *         schema:
 *           type: string
 *         example: "DEV-001"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 20
 *         example: 20
 *     responses:
 *       200:
 *         description: Масив записів (найновіші першими)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/TelemetryRow"
 *       400:
 *         description: Не передано deviceGuid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       401:
 *         description: Невірний X-Device-Key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Помилка БД
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
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
