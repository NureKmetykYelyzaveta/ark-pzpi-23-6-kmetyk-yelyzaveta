const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   - name: MedicalRecords
 *     description: Медичні записи тварин
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MedicalRecord:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *           example: 1
 *         Date:
 *           type: string
 *           format: date
 *           example: "2024-01-21"
 *         Procedure:
 *           type: string
 *           example: "Вакцинація"
 *         Notes:
 *           type: string
 *           example: "Тварина почувається добре"
 *         AnimalId:
 *           type: integer
 *           example: 3
 *         UserId:
 *           type: integer
 *           example: 2
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
 *           example: "Тварина почувається добре"
 *         AnimalId:
 *           type: integer
 *           example: 3
 *         UserId:
 *           type: integer
 *           example: 2
 */

/**
 * @swagger
 * /api/medical:
 *   get:
 *     summary: Отримати всі медичні записи
 *     tags: [MedicalRecords]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список медичних записів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/MedicalRecord"
 *       500:
 *         description: Помилка сервера
 */
router.get("/", (req, res) => {
  db.all("SELECT * FROM MedicalRecords", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/**
 * @swagger
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
 *         description: Id медичного запису
 *     responses:
 *       200:
 *         description: Медичний запис
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/MedicalRecord"
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
  db.get("SELECT * FROM MedicalRecords WHERE Id=?", [req.params.id], (err, row) => {
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  });
});

/**
 * @swagger
 * /api/medical:
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
 *           example:
 *             Date: "2024-01-21"
 *             Procedure: "Вакцинація"
 *             Notes: "Тварина почувається добре"
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
 *                   example: 10
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
  const { Date, Procedure, Notes, AnimalId, UserId } = req.body;

  db.run(
    "INSERT INTO MedicalRecords (Date, Procedure, Notes, AnimalId, UserId) VALUES (?, ?, ?, ?, ?)",
    [Date, Procedure, Notes, AnimalId, UserId],
    function (err) {
      if (err) return res.status(500).json(err);
      res.status(201).json({ id: this.lastID });
    }
  );
});

/**
 * @swagger
 * /api/medical/{id}:
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
 *         description: Id медичного запису
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/MedicalRecordInput"
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
  const { Date, Procedure, Notes, AnimalId, UserId } = req.body;

  db.run(
    "UPDATE MedicalRecords SET Date=?, Procedure=?, Notes=?, AnimalId=?, UserId=? WHERE Id=?",
    [Date, Procedure, Notes, AnimalId, UserId, req.params.id],
    function (err) {
      if (this.changes === 0) return res.status(404).json({ message: "Not found" });
      res.status(204).send();
    }
  );
});

/**
 * @swagger
 * /api/medical/{id}:
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
 *         description: Id медичного запису
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
  db.run("DELETE FROM MedicalRecords WHERE Id=?", [req.params.id], function (err) {
    if (this.changes === 0) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  });
});

module.exports = router;
