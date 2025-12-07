const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Журнал дій користувачів
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Log:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *         Action:
 *           type: string
 *           example: "Created animal"
 *         Timestamp:
 *           type: string
 *           example: "2024-01-22 14:25:00"
 *         UserId:
 *           type: integer
 *
 *     LogInput:
 *       type: object
 *       required:
 *         - Action
 *         - Timestamp
 *         - UserId
 *       properties:
 *         Action:
 *           type: string
 *           example: "Updated medical record"
 *         Timestamp:
 *           type: string
 *           example: "2024-01-22 16:30:15"
 *         UserId:
 *           type: integer
 *           example: 1
 */

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Отримати всі логи
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Список логів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Log"
 */
router.get("/", (req, res) => {
    db.all("SELECT * FROM Logs", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Додати новий лог
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/LogInput"
 *     responses:
 *       201:
 *         description: Лог створено
 */
router.post("/", (req, res) => {
    const { Action, Timestamp, UserId } = req.body;

    db.run(
        "INSERT INTO Logs (Action, Timestamp, UserId) VALUES (?, ?, ?)",
        [Action, Timestamp, UserId],
        function (err) {
            if (err) return res.status(500).json(err);
            res.status(201).json({ id: this.lastID });
        }
    );
});

module.exports = router;
