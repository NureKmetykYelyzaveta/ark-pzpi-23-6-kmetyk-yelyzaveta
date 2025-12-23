const express = require("express");
const router = express.Router();
const db = require("../db/db");

/**
 * @swagger
 * tags:
 *   - name: SmartDevices
 *     description: Розумні пристрої для відстеження тварин
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SmartDevice:
 *       type: object
 *       properties:
 *         Id:
 *           type: integer
 *           example: 1
 *         DeviceGuid:
 *           type: string
 *           example: "a1b2c3d4-e5f6-47aa-9b10-1234567890ab"
 *         DogId:
 *           type: integer
 *           example: 3
 *         LastLatitude:
 *           type: number
 *           format: float
 *           example: 49.8397
 *         LastLongitude:
 *           type: number
 *           format: float
 *           example: 24.0297
 *         BatteryLevel:
 *           type: integer
 *           example: 100
 *
 *     SmartDeviceCreate:
 *       type: object
 *       required:
 *         - deviceGuid
 *         - dogId
 *       properties:
 *         deviceGuid:
 *           type: string
 *           example: "a1b2c3d4-e5f6-47aa-9b10-1234567890ab"
 *         dogId:
 *           type: integer
 *           example: 3
 *
 *     SmartDeviceUpdate:
 *       type: object
 *       description: Можна передавати будь-які поля, які треба оновити
 *       properties:
 *         deviceGuid:
 *           type: string
 *           example: "ffff1111-2222-3333-4444-555566667777"
 *         dogId:
 *           type: integer
 *           example: 4
 *         lastLatitude:
 *           type: number
 *           format: float
 *           example: 49.84
 *         lastLongitude:
 *           type: number
 *           format: float
 *           example: 24.03
 *         batteryLevel:
 *           type: integer
 *           example: 95
 *
 *     IdResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 10
 *
 *     UpdatedResponse:
 *       type: object
 *       properties:
 *         updated:
 *           type: integer
 *           example: 1
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Not found"
 *         error:
 *           type: string
 *           example: "deviceGuid and dogId are required"
 */

/**
 * @swagger
 * /api/smart-devices:
 *   post:
 *     summary: Створити новий розумний пристрій
 *     tags: [SmartDevices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/SmartDeviceCreate"
 *           example:
 *             deviceGuid: "a1b2c3d4-e5f6-47aa-9b10-1234567890ab"
 *             dogId: 3
 *     responses:
 *       201:
 *         description: Пристрій створено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/IdResponse"
 *       400:
 *         description: Некоректні дані
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               error: "deviceGuid and dogId are required"
 *       409:
 *         description: Пристрій з таким DeviceGuid уже існує (унікальне поле)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               message: "DeviceGuid already exists"
 *       500:
 *         description: Помилка сервера
 */
router.post("/", (req, res) => {
  const { deviceGuid, dogId } = req.body;

  if (!deviceGuid || !dogId) {
    return res.status(400).json({ error: "deviceGuid and dogId are required" });
  }

  db.run(
    "INSERT INTO SmartDevices (DeviceGuid, DogId) VALUES (?, ?)",
    [deviceGuid, dogId],
    function (err) {
      if (err) {
        if (String(err.message || "").includes("UNIQUE")) {
          return res.status(409).json({ message: "DeviceGuid already exists" });
        }
        return res.status(500).json(err);
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

/**
 * @swagger
 * /api/smart-devices:
 *   get:
 *     summary: Отримати список усіх розумних пристроїв
 *     tags: [SmartDevices]
 *     responses:
 *       200:
 *         description: Список пристроїв
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/SmartDevice"
 *       500:
 *         description: Помилка сервера
 */
router.get("/", (req, res) => {
  db.all("SELECT * FROM SmartDevices", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/smart-devices/{id}:
 *   put:
 *     summary: Оновити дані пристрою
 *     description: Оновлює будь-які поля пристрою (GUID, прив’язка до тварини, координати, батарея).
 *     tags: [SmartDevices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ідентифікатор пристрою
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/SmartDeviceUpdate"
 *           example:
 *             lastLatitude: 49.84
 *             lastLongitude: 24.03
 *             batteryLevel: 95
 *     responses:
 *       200:
 *         description: Оновлено (повертає кількість змінених рядків)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/UpdatedResponse"
 *       400:
 *         description: Немає полів для оновлення
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               error: "No fields to update"
 *       404:
 *         description: Пристрій не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       409:
 *         description: Конфлікт унікальності DeviceGuid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               message: "DeviceGuid already exists"
 *       500:
 *         description: Помилка сервера
 */
router.put("/:id", (req, res) => {
  const { deviceGuid, dogId, lastLatitude, lastLongitude, batteryLevel } = req.body;

  const fields = [];
  const values = [];

  if (deviceGuid !== undefined) {
    fields.push("DeviceGuid=?");
    values.push(deviceGuid);
  }
  if (dogId !== undefined) {
    fields.push("DogId=?");
    values.push(dogId);
  }
  if (lastLatitude !== undefined) {
    fields.push("LastLatitude=?");
    values.push(lastLatitude);
  }
  if (lastLongitude !== undefined) {
    fields.push("LastLongitude=?");
    values.push(lastLongitude);
  }
  if (batteryLevel !== undefined) {
    fields.push("BatteryLevel=?");
    values.push(batteryLevel);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  values.push(req.params.id);

  db.run(
    `UPDATE SmartDevices SET ${fields.join(", ")} WHERE Id=?`,
    values,
    function (err) {
      if (err) {
        if (String(err.message || "").includes("UNIQUE")) {
          return res.status(409).json({ message: "DeviceGuid already exists" });
        }
        return res.status(500).json(err);
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "Not found" });
      }

      res.json({ updated: this.changes });
    }
  );
});

module.exports = router;
