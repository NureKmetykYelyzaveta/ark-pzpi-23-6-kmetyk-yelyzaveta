const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const db = require("../db/db");

const JWT_SECRET = process.env.JWT_SECRET || "DEFAULT_SECRET";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Операції з користувачами
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegister:
 *       type: object
 *       required:
 *         - Name
 *         - Email
 *         - Password
 *       properties:
 *         Name:
 *           type: string
 *         Email:
 *           type: string
 *         Password:
 *           type: string
 *         RoleId:
 *           type: integer
 *           example: 2
 *
 *     UserLogin:
 *       type: object
 *       required:
 *         - Email
 *         - Password
 *       properties:
 *         Email:
 *           type: string
 *         Password:
 *           type: string
 *
 *     UserToken:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: Користувача створено
 *       500:
 *         description: Помилка сервера
 */
router.post("/register", async (req, res) => {
    const { Name, Email, Password, RoleId } = req.body;

    try {
        const hash = await bcrypt.hash(Password, 10);

        db.run(
            "INSERT INTO Users (Name, Email, Password, RoleId, IsBlocked, BlockReason, LastActivity) VALUES (?, ?, ?, ?, 0, NULL, NULL)",
            [Name, Email, hash, RoleId],
            function (err) {
                if (err) {
                    console.error("REGISTER SQL ERROR:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ id: this.lastID });
            }
        );

    } catch (e) {
        console.error("HASH ERROR:", e);
        return res.status(500).json({ error: e.message });
    }
});


/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Авторизація користувача
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Успішний вхід
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/UserToken"
 *       400:
 *         description: Невірний логін або пароль
 *       403:
 *         description: Користувача заблоковано
 */
router.post("/login", (req, res) => {
    const { Email, Password } = req.body;

    if (!Email || !Password)
        return res.status(400).json({ error: "Missing Email or Password" });

    db.get("SELECT * FROM Users WHERE Email=?", [Email], async (err, user) => {
        if (err) return res.status(500).json(err);
        if (!user) return res.status(400).json({ error: "User not found" });
        if (user.IsBlocked) return res.status(403).json({ error: "User blocked" });

        const match = await bcrypt.compare(Password, user.Password);
        if (!match) return res.status(400).json({ error: "Invalid password" });

        const token = jwt.sign(
            { id: user.Id, role: user.RoleId },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.setHeader("Content-Type", "application/json");
        return res.json({ token });
    });
});

module.exports = router;
