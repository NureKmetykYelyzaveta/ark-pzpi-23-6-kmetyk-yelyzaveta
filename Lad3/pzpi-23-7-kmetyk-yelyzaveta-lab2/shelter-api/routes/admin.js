const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Адміністрування системи
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminBlockRequest:
 *       type: object
 *       properties:
 *         reason:
 *           type: string
 *           example: "Порушення правил користування системою"
 *
 *     MessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User blocked"
 *
 *     AdminStatisticsResponse:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           example: 25
 *         activeUsers:
 *           type: integer
 *           example: 10
 *         blockedUsers:
 *           type: integer
 *           example: 2
 *         admins:
 *           type: integer
 *           example: 1
 *         regularUsers:
 *           type: integer
 *           example: 24
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User not found"
 */

/**
 * @swagger
 * /api/admin/block/{id}:
 *   post:
 *     summary: Заблокувати користувача
 *     description: Блокує користувача (окрім адміністратора) та зберігає причину блокування.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ідентифікатор користувача
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/AdminBlockRequest"
 *           example:
 *             reason: "Порушення правил користування системою"
 *     responses:
 *       200:
 *         description: Користувача заблоковано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/MessageResponse"
 *             example:
 *               message: "User blocked"
 *       403:
 *         description: Заборонено блокувати адміністратора
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               message: "Cannot block admin"
 *       404:
 *         description: Користувача не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               message: "User not found"
 *       401:
 *         description: Не авторизовано
 *       500:
 *         description: Помилка сервера
 */
router.post("/block/:id", (req, res) => {
  const { reason } = req.body || {};

  db.get("SELECT RoleId FROM Users WHERE Id=?", [req.params.id], (err, user) => {
    if (err) return res.status(500).json(err);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.RoleId === 1) return res.status(403).json({ message: "Cannot block admin" });

    db.run(
      "UPDATE Users SET IsBlocked=1, BlockReason=? WHERE Id=?",
      [reason || null, req.params.id],
      function (updateErr) {
        if (updateErr) return res.status(500).json(updateErr);
        res.json({ message: "User blocked" });
      }
    );
  });
});

/**
 * @swagger
 * /api/admin/unblock/{id}:
 *   post:
 *     summary: Розблокувати користувача
 *     description: Знімає блокування з користувача та очищає причину блокування.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ідентифікатор користувача
 *     responses:
 *       200:
 *         description: Користувача розблоковано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/MessageResponse"
 *             example:
 *               message: "User unblocked"
 *       401:
 *         description: Не авторизовано
 *       500:
 *         description: Помилка сервера
 */
router.post("/unblock/:id", (req, res) => {
  db.run(
    "UPDATE Users SET IsBlocked=0, BlockReason=NULL WHERE Id=?",
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ message: "User unblocked" });
    }
  );
});

/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: Отримати статистику користувачів
 *     description: Повертає загальну кількість користувачів, активних за останні 30 днів, заблокованих та розподіл за ролями.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика користувачів
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AdminStatisticsResponse"
 *       401:
 *         description: Не авторизовано
 *       500:
 *         description: Помилка сервера
 */
router.get("/statistics", (req, res) => {
  db.all("SELECT * FROM Users", [], (err, users) => {
    if (err) return res.status(500).json(err);

    const now = Date.now();
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const activeUsers = users.filter(u => {
      const t = new Date(u.LastActivity).getTime();
      return Number.isFinite(t) && t >= monthAgo;
    }).length;

    res.json({
      totalUsers: users.length,
      activeUsers,
      blockedUsers: users.filter(u => u.IsBlocked === 1).length,
      admins: users.filter(u => u.RoleId === 1).length,
      regularUsers: users.filter(u => u.RoleId === 2).length
    });
  });
});

module.exports = router;
