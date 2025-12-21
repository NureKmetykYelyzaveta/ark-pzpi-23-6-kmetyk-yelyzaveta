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
 *         dogId:
 *           type: integer
 */

/**
 * @swagger
 * /api/smart-devices:
 *   post:
 *     summary: Створення нового розумного пристрою
 *     tags: [SmartDevices]
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
