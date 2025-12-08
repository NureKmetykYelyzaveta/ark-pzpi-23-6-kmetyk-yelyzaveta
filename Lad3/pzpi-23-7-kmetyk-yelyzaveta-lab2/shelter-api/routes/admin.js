const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Адміністрування системи
 */

/**
 * @swagger
 * /api/admin/block/{id}:
 *   post:
 *     summary: Заблокувати користувача
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Користувача заблоковано
 */
router.post("/block/:id", (req, res) => {
    const { reason } = req.body;

    db.get("SELECT RoleId FROM Users WHERE Id=?", [req.params.id], (err, user) => {
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.RoleId === 1) return res.status(403).json({ message: "Cannot block admin" });

        db.run(
            "UPDATE Users SET IsBlocked=1, BlockReason=? WHERE Id=?",
            [reason, req.params.id],
            () => res.json({ message: "User blocked" })
        );
    });
});

/**
 * @swagger
 * /api/admin/unblock/{id}:
 *   post:
 *     summary: Розблокувати користувача
 *     tags: [Admin]
 */
router.post("/unblock/:id", (req, res) => {
    db.run(
        "UPDATE Users SET IsBlocked=0, BlockReason=NULL WHERE Id=?",
        [req.params.id],
        () => res.json({ message: "User unblocked" })
    );
});

/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: Отримати статистику користувачів
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Статистика
 */
router.get("/statistics", (req, res) => {
    db.all("SELECT * FROM Users", [], (err, users) => {
        const now = Date.now();
        const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

        res.json({
            totalUsers: users.length,
            activeUsers: users.filter(u => new Date(u.LastActivity).getTime() >= monthAgo).length,
            blockedUsers: users.filter(u => u.IsBlocked === 1).length,
            admins: users.filter(u => u.RoleId === 1).length,
            regularUsers: users.filter(u => u.RoleId === 2).length
        });
    });
});

module.exports = router;
