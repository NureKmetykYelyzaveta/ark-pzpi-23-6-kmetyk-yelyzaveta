const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   name: SmartDevices
 *   description: Розумні пристрої для відстеження тварин
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SmartDeviceCreate:
 *       type: object
 *       required:
 *         - deviceGuid
 *         - dogId
 *       properties:
 *         deviceGuid:
 *           type: string
 *         dogId:
 *           type: integer
 */

/**
 * @swagger
 * /api/smart-devices:
 *   post:
 *     summary: Створення нового розумного пристрою
 *     tags: [SmartDevices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/SmartDeviceCreate"
 *     responses:
 *       201:
 *         description: Пристрій створено
 */
router.post("/", (req, res) => {
    const { deviceGuid, dogId } = req.body;

    if (!deviceGuid || !dogId) {
        return res.status(400).json({ error: "deviceGuid and dogId are required" });
    }

    db.run(
        "INSERT INTO SmartDevices (DeviceGuid, DogId, UserId) VALUES (?, ?, ?)",
        [deviceGuid, dogId, req.user.id],
        function (err) {
            if (err) return res.status(500).json(err);
            res.status(201).json({ id: this.lastID });
        }
    );
});

/**
 * @swagger
 * /api/smart-devices:
 *   get:
 *     summary: Отримати список пристроїв користувача
 *     tags: [SmartDevices]
 */
router.get("/", (req, res) => {
    db.all(
        "SELECT * FROM SmartDevices WHERE UserId = ?",
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
});

/**
 * @swagger
 * /api/smart-devices/{id}:
 *   put:
 *     summary: Оновити дані пристрою
 *     tags: [SmartDevices]
 */
router.put("/:id", (req, res) => {
    const { deviceGuid, dogId } = req.body;

    db.run(
        "UPDATE SmartDevices SET DeviceGuid=?, DogId=? WHERE Id=?",
        [deviceGuid, dogId, req.params.id],
        function (err) {
            if (err) return res.status(500).json(err);
            res.json({ updated: this.changes });
        }
    );
});

module.exports = router;
