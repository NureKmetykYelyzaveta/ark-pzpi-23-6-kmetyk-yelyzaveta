const db = require("../db/db");

module.exports = function updateActivity(req, res, next) {

    // Якщо користувач неавторизований — просто пропускаємо
    if (!req.user || !req.user.id) return next();

    const now = new Date().toISOString();

    db.run(
        "UPDATE Users SET LastActivity=? WHERE Id=?",
        [now, req.user.id],
        (err) => {
            if (err) console.error("Error updating activity:", err);
        }
    );

    next();
};
