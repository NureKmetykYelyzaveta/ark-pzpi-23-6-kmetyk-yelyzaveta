const express = require('express')
const router = express.Router()
const db = require('../db/db')

/**
 * @swagger
 * tags:
 *   name: SmartDevices
 *   description: Розумні пристрої для відстеження тварин
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SmartDeviceCreate:
 *       type: object
 *       required:
 *         - deviceGuid
 *         - dogId
 *       properties:
 *         deviceGuid:
 *           type: string
 *           example: DEV-001
 *         dogId:
 *           type: integer
 *           example: 1
 *
 *     SmartDevice:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *         DeviceGuid:
 *           type: string
 *         DogId:
 *           type: integer
 *         LastLatitude:
 *           type: number
 *         LastLongitude:
 *           type: number
 *         BatteryLevel:
 *           type: integer
 */

/**
 * @swagger
 * /api/smart-devices:
 *   post:
 *     summary: Створення нового розумного пристрою
 *     tags: [SmartDevices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/SmartDeviceCreate"
 *     responses:
 *       201:
 *         description: Пристрій створено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *       404:
 *         description: Тварину не знайдено або вона не належить користувачу
 *       409:
 *         description: DeviceGuid вже існує
 */
router.post('/', (req, res) => {
  const { deviceGuid, dogId } = req.body

  if (!deviceGuid || !dogId) {
    return res.status(400).json({ error: 'deviceGuid and dogId are required' })
  }

  db.get(
    'SELECT Id FROM Animals WHERE Id = ? AND UserId = ?',
    [dogId, req.user.id],
    (aErr, animal) => {
      if (aErr) return res.status(500).json({ error: aErr.message, code: aErr.code })
      if (!animal) return res.status(404).json({ error: 'Animal not found for this user' })

      db.run(
        'INSERT INTO SmartDevices (DeviceGuid, DogId) VALUES (?, ?)',
        [deviceGuid, dogId],
        function (insErr) {
          if (insErr) {
            if (insErr.code === 'SQLITE_CONSTRAINT') {
              return res.status(409).json({ error: 'DeviceGuid already exists' })
            }
            return res.status(500).json({ error: insErr.message, code: insErr.code })
          }
          res.status(201).json({ id: this.lastID })
        }
      )
    }
  )
})

/**
 * @swagger
 * /api/smart-devices:
 *   get:
 *     summary: Отримати список пристроїв користувача
 *     tags: [SmartDevices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пристроїв
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/SmartDevice"
 */
router.get('/', (req, res) => {
  db.all(
    `SELECT sd.*
     FROM SmartDevices sd
     JOIN Animals a ON a.Id = sd.DogId
     WHERE a.UserId = ?`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message, code: err.code })
      res.json(rows || [])
    }
  )
})

/**
 * @swagger
 * /api/smart-devices/{id}:
 *   put:
 *     summary: Оновити дані пристрою
 *     tags: [SmartDevices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/SmartDeviceCreate"
 *     responses:
 *       200:
 *         description: Пристрій оновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updated:
 *                   type: integer
 *       404:
 *         description: Пристрій не знайдено або не належить користувачу
 *       409:
 *         description: DeviceGuid вже існує
 */
router.put('/:id', (req, res) => {
  const { deviceGuid, dogId } = req.body

  if (!deviceGuid || !dogId) {
    return res.status(400).json({ error: 'deviceGuid and dogId are required' })
  }

  db.get(
    'SELECT Id FROM Animals WHERE Id = ? AND UserId = ?',
    [dogId, req.user.id],
    (aErr, animal) => {
      if (aErr) return res.status(500).json({ error: aErr.message, code: aErr.code })
      if (!animal) return res.status(404).json({ error: 'Animal not found for this user' })

      db.run(
        `UPDATE SmartDevices
         SET DeviceGuid = ?, DogId = ?
         WHERE Id = ?
           AND DogId IN (SELECT Id FROM Animals WHERE UserId = ?)`,
        [deviceGuid, dogId, req.params.id, req.user.id],
        function (updErr) {
          if (updErr) {
            if (updErr.code === 'SQLITE_CONSTRAINT') {
              return res.status(409).json({ error: 'DeviceGuid already exists' })
            }
            return res.status(500).json({ error: updErr.message, code: updErr.code })
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Device not found for this user' })
          }

          res.json({ updated: this.changes })
        }
      )
    }
  )
})

module.exports = router
