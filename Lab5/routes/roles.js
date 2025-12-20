const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Ролі користувачів
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *         Name:
 *           type: string
 *           example: Admin
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Отримати список ролей
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Список ролей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Role"
 */
router.get("/", (req, res) => {
    db.all("SELECT * FROM Roles", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        res.json(rows);
    });
});

module.exports = router;
