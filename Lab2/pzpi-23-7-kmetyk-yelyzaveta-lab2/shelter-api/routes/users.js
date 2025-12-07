const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Керування користувачами
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *         Name:
 *           type: string
 *         Email:
 *           type: string
 *         Password:
 *           type: string
 *         RoleId:
 *           type: integer
 *
 *     UserInput:
 *       type: object
 *       required:
 *         - Name
 *         - Email
 *         - Password
 *         - RoleId
 *       properties:
 *         Name:
 *           type: string
 *           example: "Іван"
 *         Email:
 *           type: string
 *           example: "ivan@gmail.com"
 *         Password:
 *           type: string
 *           example: "123456"
 *         RoleId:
 *           type: integer
 *           example: 1
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Отримати всіх користувачів
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Список користувачів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/User"
 */
router.get("/", (req, res) => {
    db.all("SELECT * FROM Users", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Отримати користувача за ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Користувач знайдений
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/User"
 *       404:
 *         description: Не знайдено
 */
router.get("/:id", (req, res) => {
    db.get("SELECT * FROM Users WHERE Id=?", [req.params.id], (err, row) => {
        if (!row) return res.status(404).json({ message: "Not found" });
        res.json(row);
    });
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Додати нового користувача
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserInput"
 *     responses:
 *       201:
 *         description: Користувача створено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 */
router.post("/", (req, res) => {
    const { Name, Email, Password, RoleId } = req.body;

    db.run(
        "INSERT INTO Users (Name, Email, Password, RoleId) VALUES (?, ?, ?, ?)",
        [Name, Email, Password, RoleId],
        function (err) {
            if (err) return res.status(500).json(err);
            res.status(201).json({ id: this.lastID });
        }
    );
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Оновити користувача
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UserInput"
 *     responses:
 *       204:
 *         description: Успішно оновлено
 *       404:
 *         description: Не знайдено
 */
router.put("/:id", (req, res) => {
    const { Name, Email, Password, RoleId } = req.body;

    db.run(
        "UPDATE Users SET Name=?, Email=?, Password=?, RoleId=? WHERE Id=?",
        [Name, Email, Password, RoleId, req.params.id],
        function (err) {
            if (this.changes === 0)
                return res.status(404).json({ message: "Not found" });
            res.status(204).send();
        }
    );
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Видалити користувача
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       204:
 *         description: Видалено
 *       404:
 *         description: Не знайдено
 */
router.delete("/:id", (req, res) => {
    db.run("DELETE FROM Users WHERE Id=?", [req.params.id], function (err) {
        if (this.changes === 0)
            return res.status(404).json({ message: "Not found" });
        res.status(204).send();
    });
});

module.exports = router;
