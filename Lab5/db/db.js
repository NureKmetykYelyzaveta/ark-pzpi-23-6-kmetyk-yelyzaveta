const sqlite3 = require('sqlite3').verbose()

// Render: filesystem is ephemeral unless you attach a persistent disk.
// You can override the DB file path via SQLITE_PATH.
const DB_PATH = process.env.SQLITE_PATH || './db/pet_shelter.db'

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Не вдалося підключитися до БД:', err.message)
  } else {
    console.log(`Підключено до SQLite БД: ${DB_PATH}`)
  }
})

// Promisified API
db.runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}

db.getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

db.allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

module.exports = db
