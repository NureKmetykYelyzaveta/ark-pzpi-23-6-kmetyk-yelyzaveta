const express = require('express')
const router = express.Router()
const db = require('../db/db')

/**
 * @swagger
 * tags:
 *   - name: Treatments
 *     description: Лікування тварин
 *
 * components:
 *   schemas:
 *     Treatment:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *           example: 3
 *         Type:
 *           type: string
 *           example: "Антибіотики"
 *         Description:
 *           type: string
 *           nullable: true
 *           example: "Призначено курс на 5 днів"
 *         AnimalId:
 *           type: integer
 *           example: 1
 *
 *     TreatmentInput:
 *       type: object
 *       required:
 *         - Type
 *         - AnimalId
 *       properties:
 *         Type:
 *           type: string
 *           example: "Вітаміни"
 *         Description:
 *           type: string
 *           nullable: true
 *           example: "Загальний курс підтримки"
 *         AnimalId:
 *           type: integer
 *           example: 1
 *
 * /api/treatments:
 *   get:
 *     summary: Отримати всі призначення лікувань
 *     tags: [Treatments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Масив лікувань
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Treatment"
 *       401:
 *         description: Немає токена або токен невалідний
 *       500:
 *         description: Помилка сервера/БД
 *
 *   post:
 *     summary: Додати нове лікування
 *     tags: [Treatments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/TreatmentInput"
 *     responses:
 *       201:
 *         description: Лікування створено
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
 * /api/treatments/{id}:
 *   get:
 *     summary: Отримати призначення лікування за Id
 *     tags: [Treatments]
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
 *         description: Одне лікування
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Treatment"
 *       401:
 *         description: Немає токена або токен невалідний
 *       404:
 *         description: Не знайдено
 *       500:
 *         description: Помилка сервера/БД
 *
 *   put:
 *     summary: Оновити лікування
 *     tags: [Treatments]
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
 *             $ref: "#/components/schemas/TreatmentInput"
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
 *     summary: Видалити лікування
 *     tags: [Treatments]
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
  db.all('SELECT * FROM Treatments', [], (err, rows) => {
    if (err) return res.status(500).json(err)
    res.json(rows)
  })
})

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM Treatments WHERE Id=?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json(err)
    if (!row) return res.status(404).json({ message: 'Not found' })
    res.json(row)
  })
})

router.post('/', (req, res) => {
  const { Type, Description, AnimalId } = req.body

  db.run(
    'INSERT INTO Treatments (Type, Description, AnimalId) VALUES (?, ?, ?)',
    [Type, Description, AnimalId],
    function (err) {
      if (err) return res.status(500).json(err)
      res.status(201).json({ id: this.lastID })
    }
  )
})

router.put('/:id', (req, res) => {
  const { Type, Description, AnimalId } = req.body

  db.run(
    'UPDATE Treatments SET Type=?, Description=?, AnimalId=? WHERE Id=?',
    [Type, Description, AnimalId, req.params.id],
    function (err) {
      if (err) return res.status(500).json(err)
      if (this.changes === 0) return res.status(404).json({ message: 'Not found' })
      res.status(204).send()
    }
  )
})

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM Treatments WHERE Id=?', [req.params.id], function (err) {
    if (err) return res.status(500).json(err)
    if (this.changes === 0) return res.status(404).json({ message: 'Not found' })
    res.status(204).send()
  })
})

module.exports = router
