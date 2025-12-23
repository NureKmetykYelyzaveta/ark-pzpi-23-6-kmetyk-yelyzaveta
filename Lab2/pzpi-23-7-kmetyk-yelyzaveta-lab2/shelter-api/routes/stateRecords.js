const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   - name: StateRecords
 *     description: Стани тварин
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     StateRecord:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *           example: 1
 *         Date:
 *           type: string
 *           format: date
 *           example: "2024-01-20"
 *         State:
 *           type: string
 *           example: "Підвищена температура"
 *         Severity:
 *           type: string
 *           example: "High"
 *         AnimalId:
 *           type: integer
 *           example: 3
 *         UserId:
 *           type: integer
 *           example: 2
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
 *           example: "Medium"
 *         AnimalId:
 *           type: integer
 *           example: 3
 *         UserId:
 *           type: integer
 *           example: 2
 */

/**
 * @swagger
 * /api/state-records:
 *   get:
 *     summary: Отримати всі записи станів тварин
 *     tags: [StateRecords]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список записів станів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/StateRecord"
 *       500:
 *         description: Помилка сервера
 */
router.get("/", (req, res) => {
  db.all("SELECT * FROM StateRecords", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/**
 * @swagger
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
 *         description: Id запису стану
 *     responses:
 *       200:
 *         description: Запис стану
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StateRecord"
 *       404:
 *         description: Запис не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Помилка сервера
 */
router.get("/:id", (req, res) => {
  db.get("SELECT * FROM StateRecords WHERE Id=?", [req.params.id], (err, row) => {
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  });
});

/**
 * @swagger
 * /api/state-records:
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
 *           example:
 *             Date: "2024-01-20"
 *             State: "Поганий апетит"
 *             Severity: "Medium"
 *             AnimalId: 3
 *             UserId: 2
 *     responses:
 *       201:
 *         description: Створено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 11
 *       400:
 *         description: Некоректні дані (валідація)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Помилка сервера
 */
router.post("/", (req, res) => {
  const { Date, State, Severity, AnimalId, UserId } = req.body;

  db.run(
    "INSERT INTO StateRecords (Date, State, Severity, AnimalId, UserId) VALUES (?, ?, ?, ?, ?)",
    [Date, State, Severity, AnimalId, UserId],
    function (err) {
      if (err) return res.status(500).json(err);
      res.status(201).json({ id: this.lastID });
    }
  );
});

/**
 * @swagger
 * /api/state-records/{id}:
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
 *         description: Id запису стану
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/StateRecordInput"
 *     responses:
 *       204:
 *         description: Оновлено успішно (без тіла)
 *       404:
 *         description: Запис не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Помилка сервера
 */
router.put("/:id", (req, res) => {
  const { Date, State, Severity, AnimalId, UserId } = req.body;

  db.run(
    "UPDATE StateRecords SET Date=?, State=?, Severity=?, AnimalId=?, UserId=? WHERE Id=?",
    [Date, State, Severity, AnimalId, UserId, req.params.id],
    function (err) {
      if (this.changes === 0) return res.status(404).json({ message: "Not found" });
      res.status(204).send();
    }
  );
});

/**
 * @swagger
 * /api/state-records/{id}:
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
 *         description: Id запису стану
 *     responses:
 *       204:
 *         description: Видалено успішно (без тіла)
 *       404:
 *         description: Запис не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Помилка сервера
 */
router.delete("/:id", (req, res) => {
  db.run("DELETE FROM StateRecords WHERE Id=?", [req.params.id], function (err) {
    if (this.changes === 0) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  });
});

module.exports = router;
