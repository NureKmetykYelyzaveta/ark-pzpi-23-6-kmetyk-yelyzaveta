const express = require('express')
const router = express.Router()
const db = require('../db/db')

/**
 * @swagger
 * tags:
 *   - name: StateRecords
 *     description: Стани тварин
 *
 * components:
 *   schemas:
 *     StateRecord:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *           example: 5
 *         Date:
 *           type: string
 *           format: date
 *           example: "2024-01-20"
 *         State:
 *           type: string
 *           example: "Підвищена температура"
 *         Severity:
 *           type: string
 *           nullable: true
 *           example: "High"
 *         AnimalId:
 *           type: integer
 *           example: 1
 *         UserId:
 *           type: integer
 *           example: 2
 *
 *     StateRecordInput:
 *       type: object
 *       required:
 *         - Date
 *         - State
 *         - AnimalId
 *         - UserId
 *       properties:
 *         Date:
 *           type: string
 *           format: date
 *           example: "2024-01-20"
 *         State:
 *           type: string
 *           example: "Поганий апетит"
 *         Severity:
 *           type: string
 *           nullable: true
 *           example: "Medium"
 *         AnimalId:
 *           type: integer
 *           example: 1
 *         UserId:
 *           type: integer
 *           example: 2
 *
 * /api/state-records:
 *   get:
 *     summary: Отримати всі записи станів тварин
 *     tags: [StateRecords]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Масив записів станів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/StateRecord"
 *       401:
 *         description: Немає токена або токен невалідний
 *       500:
 *         description: Помилка сервера/БД
 *
 *   post:
 *     summary: Додати новий запис стану
 *     tags: [StateRecords]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/StateRecordInput"
 *     responses:
 *       201:
 *         description: Запис створено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *       400:
 *         description: Некоректне тіло запиту
 *       401:
 *         description: Немає токена або токен невалідний
 *       500:
 *         description: Помилка сервера/БД
 *
 * /api/state-records/{id}:
 *   get:
 *     summary: Отримати запис стану за ID
 *     tags: [StateRecords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Один запис стану
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StateRecord"
 *       401:
 *         description: Немає токена або токен невалідний
 *       404:
 *         description: Не знайдено
 *       500:
 *         description: Помилка сервера/БД
 *
 *   put:
 *     summary: Оновити запис стану
 *     tags: [StateRecords]
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
 *             $ref: "#/components/schemas/StateRecordInput"
 *     responses:
 *       204:
 *         description: Оновлено (без тіла відповіді)
 *       401:
 *         description: Немає токена або токен невалідний
 *       404:
 *         description: Не знайдено
 *       500:
 *         description: Помилка сервера/БД
 *
 *   delete:
 *     summary: Видалити запис стану
 *     tags: [StateRecords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Видалено (без тіла відповіді)
 *       401:
 *         description: Немає токена або токен невалідний
 *       404:
 *         description: Не знайдено
 *       500:
 *         description: Помилка сервера/БД
 */

router.get('/', (req, res) => {
  db.all('SELECT * FROM StateRecords', [], (err, rows) => {
    if (err) return res.status(500).json(err)
    res.json(rows)
  })
})

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM StateRecords WHERE Id=?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json(err)
    if (!row) return res.status(404).json({ message: 'Not found' })
    res.json(row)
  })
})

router.post('/', (req, res) => {
  const { Date, State, Severity, AnimalId, UserId } = req.body

  db.run(
    'INSERT INTO StateRecords (Date, State, Severity, AnimalId, UserId) VALUES (?, ?, ?, ?, ?)',
    [Date, State, Severity, AnimalId, UserId],
    function (err) {
      if (err) return res.status(500).json(err)
      res.status(201).json({ id: this.lastID })
    }
  )
})

router.put('/:id', (req, res) => {
  const { Date, State, Severity, AnimalId, UserId } = req.body

  db.run(
    'UPDATE StateRecords SET Date=?, State=?, Severity=?, AnimalId=?, UserId=? WHERE Id=?',
    [Date, State, Severity, AnimalId, UserId, req.params.id],
    function (err) {
      if (err) return res.status(500).json(err)
      if (this.changes === 0) return res.status(404).json({ message: 'Not found' })
      res.status(204).send()
    }
  )
})

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM StateRecords WHERE Id=?', [req.params.id], function (err) {
    if (err) return res.status(500).json(err)
    if (this.changes === 0) return res.status(404).json({ message: 'Not found' })
    res.status(204).send()
  })
})

module.exports = router
