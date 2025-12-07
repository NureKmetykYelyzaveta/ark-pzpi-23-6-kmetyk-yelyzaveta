const sqlite3 = require("sqlite3").verbose();


const db = new sqlite3.Database("./db/pet_shelter.db", (err) => {
    if (err) {
        console.error("Не вдалося підключитися до БД:", err.message);
    } else {
        console.log("Підключено до SQLite БД pet_shelter.db");
    }
});

module.exports = db;
