const express = require('express')
const router = express.Router()
const db = require('../db/db')

/**
 * @swagger
 * tags:
 *   - name: MedicalRecords
 *     description: Медичні записи тварин
 *
 * components:
 *   schemas:
 *     MedicalRecord:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *           example: 10
 *         Date:
 *           type: string
 *           format: date
 *           example: "2024-01-21"
 *         Procedure:
 *           type: string
 *           example: "Вакцинація"
 *         Notes:
 *           type: string
 *           nullable: true
 *           example: "Тварина почувається добре"
 *         AnimalId:
 *           type: integer
 *           example: 1
 *         UserId:
 *           type: integer
 *           example: 2
 *
 *     MedicalRecordInput:
 *       type: object
 *       required:
 *         - Date
 *         - Procedure
 *         - AnimalId
 *         - UserId
 *       properties:
 *         Date:
 *           type: string
 *           format: date
 *           example: "2024-01-21"
 *         Procedure:
 *           type: string
 *           example: "Вакцинація"
 *         Notes:
 *           type: string
 *           nullable: true
 *           example: "Тварина почувається добре"
 *         AnimalId:
 *           type: integer
 *           example: 1
 *         UserId:
 *           type: integer
 *           example: 2
 *
 * /api/medical:
 *   get:
 *     summary: Отримати всі медичні записи
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Масив медичних записів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/MedicalRecord"
 *       401:
 *         description: Немає токена або токен невалідний
 *       500:
 *         description: Помилка сервера/БД
 *
 *   post:
 *     summary: Додати новий медичний запис
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/MedicalRecordInput"
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
 *                   example: 11
 *       400:
 *         description: Некоректне тіло запиту
 *       401:
 *         description: Немає токена або токен невалідний
 *       500:
 *         description: Помилка сервера/БД
 *
 * /api/medical/{id}:
 *   get:
 *     summary: Отримати медичний запис за Id
 *     tags: [MedicalRecords]
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
 *         description: Один медичний запис
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/MedicalRecord"
 *       401:
 *         description: Немає токена або токен невалідний
 *       404:
 *         description: Не знайдено
 *       500:
 *         description: Помилка сервера/БД
 *
 *   put:
 *     summary: Оновити медичний запис
 *     tags: [MedicalRecords]
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
 *             $ref: "#/components/schemas/MedicalRecordInput"
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
 *     summary: Видалити медичний запис
 *     tags: [MedicalRecords]
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
 *
 * /api/medical-records:
 *   get:
 *     summary: Те саме що /api/medical (alias)
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Масив медичних записів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/MedicalRecord"
 *       401:
 *         description: Немає токена або токен невалідний
 *       500:
 *         description: Помилка сервера/БД
 *
 *   post:
 *     summary: Те саме що /api/medical (alias)
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/MedicalRecordInput"
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
 */

router.get('/', (req, res) => {
  db.all('SELECT * FROM MedicalRecords', [], (err, rows) => {
    if (err) return res.status(500).json(err)
    res.json(rows)
  })
})

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM MedicalRecords WHERE Id=?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json(err)
    if (!row) return res.status(404).json({ message: 'Not found' })
    res.json(row)
  })
})

router.post('/', (req, res) => {
  const { Date, Procedure, Notes, AnimalId, UserId } = req.body

  db.run(
    'INSERT INTO MedicalRecords (Date, Procedure, Notes, AnimalId, UserId) VALUES (?, ?, ?, ?, ?)',
    [Date, Procedure, Notes, AnimalId, UserId],
    function (err) {
      if (err) return res.status(500).json(err)
      res.status(201).json({ id: this.lastID })
    }
  )
})

router.put('/:id', (req, res) => {
  const { Date, Procedure, Notes, AnimalId, UserId } = req.body

  db.run(
    'UPDATE MedicalRecords SET Date=?, Procedure=?, Notes=?, AnimalId=?, UserId=? WHERE Id=?',
    [Date, Procedure, Notes, AnimalId, UserId, req.params.id],
    function (err) {
      if (err) return res.status(500).json(err)
      if (this.changes === 0) return res.status(404).json({ message: 'Not found' })
      res.status(204).send()
    }
  )
})

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM MedicalRecords WHERE Id=?', [req.params.id], function (err) {
    if (err) return res.status(500).json(err)
    if (this.changes === 0) return res.status(404).json({ message: 'Not found' })
    res.status(204).send()
  })
})

module.exports = router
