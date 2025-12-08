const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./db/pet_shelter.db", (err) => {
    if (err) {
        console.error("Не вдалося підключитися до БД:", err.message);
    } else {
        console.log("Підключено до SQLite БД pet_shelter.db");
    }
});

// Promisified API
db.runAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

db.getAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

db.allAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

module.exports = db;
