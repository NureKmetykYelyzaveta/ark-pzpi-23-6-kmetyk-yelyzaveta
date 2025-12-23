const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   - name: Treatments
 *     description: Лікування тварин
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Treatment:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *           example: 1
 *         Type:
 *           type: string
 *           example: "Антибіотики"
 *         Description:
 *           type: string
 *           example: "Призначено курс на 5 днів"
 *         AnimalId:
 *           type: integer
 *           example: 3
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
 *           example: "Загальний курс підтримки"
 *         AnimalId:
 *           type: integer
 *           example: 3
 */

/**
 * @swagger
 * /api/treatments:
 *   get:
 *     summary: Отримати всі призначення лікувань
 *     tags: [Treatments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список лікувань
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Treatment"
 *       500:
 *         description: Помилка сервера
 */
router.get("/", (req, res) => {
  db.all("SELECT * FROM Treatments", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/**
 * @swagger
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
 *         description: Id призначення лікування
 *     responses:
 *       200:
 *         description: Призначення лікування
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Treatment"
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
  db.get("SELECT * FROM Treatments WHERE Id=?", [req.params.id], (err, row) => {
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  });
});

/**
 * @swagger
 * /api/treatments:
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
 *           example:
 *             Type: "Вітаміни"
 *             Description: "Загальний курс підтримки"
 *             AnimalId: 3
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
 *                   example: 12
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
  const { Type, Description, AnimalId } = req.body;

  db.run(
    "INSERT INTO Treatments (Type, Description, AnimalId) VALUES (?, ?, ?)",
    [Type, Description, AnimalId],
    function (err) {
      if (err) return res.status(500).json(err);
      res.status(201).json({ id: this.lastID });
    }
  );
});

/**
 * @swagger
 * /api/treatments/{id}:
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
 *         description: Id лікування
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/TreatmentInput"
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
  const { Type, Description, AnimalId } = req.body;

  db.run(
    "UPDATE Treatments SET Type=?, Description=?, AnimalId=? WHERE Id=?",
    [Type, Description, AnimalId, req.params.id],
    function (err) {
      if (this.changes === 0) return res.status(404).json({ message: "Not found" });
      res.status(204).send();
    }
  );
});

/**
 * @swagger
 * /api/treatments/{id}:
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
 *         description: Id лікування
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
  db.run("DELETE FROM Treatments WHERE Id=?", [req.params.id], function (err) {
    if (this.changes === 0) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  });
});

module.exports = router;
