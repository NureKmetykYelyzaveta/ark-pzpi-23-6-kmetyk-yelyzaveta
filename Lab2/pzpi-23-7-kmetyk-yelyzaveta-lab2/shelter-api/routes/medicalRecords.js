const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   name: MedicalRecords
 *   description: Медичні записи тварин
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MedicalRecord:
 *       type: object
 *       properties:
 *         Id: { type: integer }
 *         Date: { type: string, example: "2024-01-21" }
 *         Procedure: { type: string, example: "Вакцинація" }
 *         Notes: { type: string, example: "Тварина почувається добре" }
 *         AnimalId: { type: integer }
 *         UserId: { type: integer }
 */

/**
 * @swagger
 * /api/medical:
 *   get:
 *     summary: Отримати всі медичні записи
 *     tags: [MedicalRecords]
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
 */
router.delete("/:id", (req, res) => {
    db.run("DELETE FROM MedicalRecords WHERE Id=?", [req.params.id], function (err) {
        if (this.changes === 0) return res.status(404).json({ message: "Not found" });
        res.status(204).send();
    });
});

module.exports = router;
