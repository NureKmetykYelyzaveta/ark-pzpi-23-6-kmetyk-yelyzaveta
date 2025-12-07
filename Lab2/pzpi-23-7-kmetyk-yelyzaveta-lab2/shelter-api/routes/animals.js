const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * components:
 *   schemas:
 *     Animal:
 *       type: object
 *       required:
 *         - Name
 *         - Type
 *       properties:
 *         Id:
 *           type: integer
 *           description: Автоматично генерується
 *         Name:
 *           type: string
 *           example: Барсик
 *         Type:
 *           type: string
 *           example: Cat
 *         Breed:
 *           type: string
 *           example: British Shorthair
 *         Age:
 *           type: integer
 *           example: 3
 *         Weight:
 *           type: number
 *           example: 4.5
 *         Description:
 *           type: string
 *           example: Дуже лагідний кіт
 *         PhotoURL:
 *           type: string
 *           example: https://example.com/photo.jpg
 *         UserId:
 *           type: integer
 *           example: 1
 */

/**
 * @swagger
 * tags:
 *   name: Animals
 *   description: Операції з тваринами
 */

/**
 * @swagger
 * /api/animals:
 *   get:
 *     summary: Отримати список усіх тварин
 *     tags: [Animals]
 *     responses:
 *       200:
 *         description: Список тварин
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Animal'
 */
router.get("/", (req, res) => {
    db.all("SELECT * FROM Animals", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

/**
 * @swagger
 * /api/animals/{id}:
 *   get:
 *     summary: Отримати тварину за Id
 *     tags: [Animals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Id тварини
 *     responses:
 *       200:
 *         description: Інформація про тварину
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Animal'
 *       404:
 *         description: Тварину не знайдено
 */
router.get("/:id", (req, res) => {
    db.get("SELECT * FROM Animals WHERE Id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "Animal not found" });
        res.json(row);
    });
});

/**
 * @swagger
 * /api/animals:
 *   post:
 *     summary: Додати нову тварину
 *     tags: [Animals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Animal'
 *     responses:
 *       201:
 *         description: Тварина успішно створена
 */
router.post("/", (req, res) => {
    const { Name, Type, Breed, Age, Weight, Description, PhotoURL, UserId } = req.body;

    const sql = `
        INSERT INTO Animals (Name, Type, Breed, Age, Weight, Description, PhotoURL, UserId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(sql, [Name, Type, Breed, Age, Weight, Description, PhotoURL, UserId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID });
    });
});

/**
 * @swagger
 * /api/animals/{id}:
 *   put:
 *     summary: Оновити дані тварини
 *     tags: [Animals]
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
 *             $ref: '#/components/schemas/Animal'
 *     responses:
 *       204:
 *         description: Оновлено
 *       404:
 *         description: Не знайдено
 */
router.put("/:id", (req, res) => {
    const { Name, Type, Breed, Age, Weight, Description, PhotoURL, UserId } = req.body;

    const sql = `
        UPDATE Animals
        SET Name = ?, Type = ?, Breed = ?, Age = ?, Weight = ?, Description = ?, PhotoURL = ?, UserId = ?
        WHERE Id = ?
    `;
    db.run(sql, [Name, Type, Breed, Age, Weight, Description, PhotoURL, UserId, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Animal not found" });
        res.status(204).send();
    });
});

/**
 * @swagger
 * /api/animals/{id}:
 *   delete:
 *     summary: Видалити тварину
 *     tags: [Animals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Видалено
 *       404:
 *         description: Не знайдено
 */
router.delete("/:id", (req, res) => {
    db.run("DELETE FROM Animals WHERE Id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Animal not found" });
        res.status(204).send();
    });
});

module.exports = router;
