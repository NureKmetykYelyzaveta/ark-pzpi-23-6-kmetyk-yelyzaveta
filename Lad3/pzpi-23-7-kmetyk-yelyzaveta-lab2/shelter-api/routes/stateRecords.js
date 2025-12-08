const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   name: StateRecords
 *   description: Стани тварин
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
 *         Date:
 *           type: string
 *           example: "2024-01-20"
 *         State:
 *           type: string
 *           example: "Підвищена температура"
 *         Severity:
 *           type: string
 *           example: "High"
 *         AnimalId:
 *           type: integer
 *         UserId:
 *           type: integer
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
 *           example: "2024-01-20"
 *         State:
 *           type: string
 *           example: "Поганий апетит"
 *         Severity:
 *           type: string
 *           example: "Medium"
 *         AnimalId:
 *           type: integer
 *         UserId:
 *           type: integer
 */

/**
 * @swagger
 * /api/state-records:
 *   get:
 *     summary: Отримати всі записи станів тварин
 *     tags: [StateRecords]
 *     responses:
 *       200:
 *         description: Список станів
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
 *     summary: Отримати стан тварини за ID
 *     tags: [StateRecords]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/StateRecordInput"
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
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 */
router.put("/:id", (req, res) => {
    const { Date, State, Severity, AnimalId, UserId } = req.body;

    db.run(
        "UPDATE StateRecords SET Date=?, State=?, Severity=?, AnimalId=?, UserId=? WHERE Id=?",
        [Date, State, Severity, AnimalId, UserId, req.params.id],
        function (err) {
            if (this.changes === 0)
                return res.status(404).json({ message: "Not found" });
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
 */
router.delete("/:id", (req, res) => {
    db.run("DELETE FROM StateRecords WHERE Id=?", [req.params.id], function (err) {
        if (this.changes === 0)
            return res.status(404).json({ message: "Not found" });
        res.status(204).send();
    });
});

module.exports = router;
