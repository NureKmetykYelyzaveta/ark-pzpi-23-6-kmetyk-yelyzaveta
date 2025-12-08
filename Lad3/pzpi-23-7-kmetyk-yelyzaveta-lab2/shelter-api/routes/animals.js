const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   name: Animals
 *   description: Операції для керування тваринами
 */

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
 *         Name:
 *           type: string
 *           example: Барсік
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
 *           example: https://example.com/cat.jpg
 *         UserId:
 *           type: integer
 *           description: ID власника
 */

/**
 * @swagger
 * /api/animals:
 *   get:
 *     summary: Отримати всіх тварин поточного користувача
 *     tags: [Animals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список тварин користувача
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Animal"
 */
router.get("/", (req, res) => {
    const userId = req.user.id;

    db.all("SELECT * FROM Animals WHERE UserId=?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


/**
 * @swagger
 * /api/animals/{id}:
 *   get:
 *     summary: Отримати тварину за її ID
 *     tags: [Animals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Об'єкт тварини
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Animal"
 *       404:
 *         description: Тварину не знайдено або вона не належить користувачу
 */
router.get("/:id", (req, res) => {
    const id = req.params.id;
    const userId = req.user.id;

    db.get("SELECT * FROM Animals WHERE Id=? AND UserId=?", [id, userId], (err, row) => {
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
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Animal"
 *     responses:
 *       201:
 *         description: Тварину створено
 */
router.post("/", (req, res) => {
    const { Name, Type, Breed, Age, Weight, Description, PhotoURL } = req.body;

    const userId = req.user.id;

    const sql = `
        INSERT INTO Animals (Name, Type, Breed, Age, Weight, Description, PhotoURL, UserId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [Name, Type, Breed, Age, Weight, Description, PhotoURL, userId], function (err) {
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/Animal"
 *     responses:
 *       200:
 *         description: Тварину оновлено
 *       404:
 *         description: Тварину не знайдено
 */
router.put("/:id", (req, res) => {
    const id = req.params.id;
    const userId = req.user.id;

    const { Name, Type, Breed, Age, Weight, Description, PhotoURL } = req.body;

    const sql = `
        UPDATE Animals SET Name=?, Type=?, Breed=?, Age=?, Weight=?, Description=?, PhotoURL=?
        WHERE Id=? AND UserId=?
    `;

    db.run(sql, [Name, Type, Breed, Age, Weight, Description, PhotoURL, id, userId], function (err) {
        if (this.changes === 0)
            return res.status(404).json({ message: "Animal not found" });

        res.json({ message: "Animal updated" });
    });
});


/**
 * @swagger
 * /api/animals/{id}:
 *   delete:
 *     summary: Видалити тварину
 *     tags: [Animals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Тварину видалено
 *       404:
 *         description: Тварину не знайдено
 */
router.delete("/:id", (req, res) => {
    const id = req.params.id;
    const userId = req.user.id;

    db.run("DELETE FROM Animals WHERE Id=? AND UserId=?", [id, userId], function (err) {
        if (this.changes === 0)
            return res.status(404).json({ message: "Animal not found" });

        res.json({ message: "Animal deleted" });
    });
});

module.exports = router;
