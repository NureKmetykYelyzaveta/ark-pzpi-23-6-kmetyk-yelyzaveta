const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.post("/", async (req, res) => {
    const { Action } = req.body;

    await db.runAsync(
        `INSERT INTO Logs (Action, Timestamp, UserId)
         VALUES (?, datetime('now'), ?)`,
        [Action, req.user.id]
    );

    res.status(201).json({ message: "Log saved" });
});

router.get("/", async (req, res) => {
    if (req.user.role !== 1)
        return res.status(403).json({ error: "Forbidden" });

    const logs = await db.allAsync(`SELECT * FROM Logs ORDER BY Timestamp DESC`);
    res.json(logs);
});

module.exports = router;
