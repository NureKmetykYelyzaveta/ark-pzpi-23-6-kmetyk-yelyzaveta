const bcrypt = require('bcryptjs')
const db = require('./db')

async function ensureColumn(table, column, sqlType) {
  const cols = await db.allAsync(`PRAGMA table_info(${table})`)
  const has = (cols || []).some((c) => c.name === column)
  if (!has) {
    await db.runAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${sqlType}`)
  }
}

async function ensureSchema() {
  await db.runAsync('PRAGMA foreign_keys = ON')

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS Roles (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL
    )
  `)

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS Users (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Email TEXT UNIQUE NOT NULL,
      Password TEXT NOT NULL,
      RoleId INTEGER NOT NULL,
      IsBlocked INTEGER DEFAULT 0,
      BlockReason TEXT,
      LastActivity TEXT,
      FOREIGN KEY (RoleId) REFERENCES Roles(Id)
    )
  `)

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS Animals (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Type TEXT NOT NULL,
      Breed TEXT,
      Age INTEGER,
      Weight REAL,
      Description TEXT,
      PhotoURL TEXT,
      UserId INTEGER NOT NULL,
      FOREIGN KEY (UserId) REFERENCES Users(Id)
    )
  `)

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS SmartDevices (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      DeviceGuid TEXT NOT NULL UNIQUE,
      DogId INTEGER NOT NULL,
      LastLatitude REAL DEFAULT 0,
      LastLongitude REAL DEFAULT 0,
      BatteryLevel INTEGER DEFAULT 100,
      FOREIGN KEY (DogId) REFERENCES Animals(Id)
    )
  `)

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS Logs (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Action TEXT NOT NULL,
      Timestamp TEXT NOT NULL,
      UserId INTEGER NOT NULL,
      FOREIGN KEY (UserId) REFERENCES Users(Id)
    )
  `)

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS MedicalRecords (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Date TEXT NOT NULL,
      Procedure TEXT NOT NULL,
      Notes TEXT,
      AnimalId INTEGER NOT NULL,
      UserId INTEGER NOT NULL,
      FOREIGN KEY (AnimalId) REFERENCES Animals(Id),
      FOREIGN KEY (UserId) REFERENCES Users(Id)
    )
  `)

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS StateRecords (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Date TEXT NOT NULL,
      State TEXT NOT NULL,
      Severity TEXT,
      AnimalId INTEGER NOT NULL,
      UserId INTEGER NOT NULL,
      FOREIGN KEY (AnimalId) REFERENCES Animals(Id),
      FOREIGN KEY (UserId) REFERENCES Users(Id)
    )
  `)

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS Treatments (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Type TEXT NOT NULL,
      Description TEXT,
      AnimalId INTEGER NOT NULL,
      FOREIGN KEY (AnimalId) REFERENCES Animals(Id)
    )
  `)

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS DeviceTelemetry (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      DeviceGuid TEXT NOT NULL,
      DogId INTEGER,
      TempC REAL,
      Motion REAL,
      TempAlert INTEGER DEFAULT 0,
      MotionAlert INTEGER DEFAULT 0,
      CreatedAt TEXT DEFAULT (datetime('now'))
    )
  `)

  await ensureColumn('SmartDevices', 'UserId', 'INTEGER')
}

async function seed() {
  await ensureSchema()

  const roleCountRow = await db.getAsync('SELECT COUNT(*) AS cnt FROM Roles')
  const roleCount = roleCountRow ? roleCountRow.cnt : 0

  if (roleCount === 0) {
    const roles = ['Admin', 'Veterinarian', 'Worker', 'Volunteer']
    for (const name of roles) {
      await db.runAsync('INSERT INTO Roles (Name) VALUES (?)', [name])
    }
  }

  const workerRole = await db.getAsync('SELECT Id FROM Roles WHERE Name = ?', ['Worker'])
  const roleId = workerRole ? workerRole.Id : 1

  // 2) Demo user
  const demoEmail = process.env.SEED_EMAIL || 'demo@shelter.local'
  const demoPassword = process.env.SEED_PASSWORD || 'Demo1234!'
  const demoName = process.env.SEED_NAME || 'Demo User'

  let user = await db.getAsync('SELECT Id FROM Users WHERE Email = ?', [demoEmail])
  if (!user) {
    const hash = await bcrypt.hash(demoPassword, 10)
    const r = await db.runAsync(
      'INSERT INTO Users (Name, Email, Password, RoleId) VALUES (?, ?, ?, ?)',
      [demoName, demoEmail, hash, roleId]
    )
    user = { Id: r.lastID }
  }

  const userId = user.Id

  const animalsCountRow = await db.getAsync(
    'SELECT COUNT(*) AS cnt FROM Animals WHERE UserId = ?',
    [userId]
  )
  const animalsCount = animalsCountRow ? animalsCountRow.cnt : 0

  if (animalsCount === 0) {
    await db.runAsync(
      `INSERT INTO Animals (Name, Type, Breed, Age, Weight, Description, PhotoURL, UserId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Барсік',
        'Cat',
        'British Shorthair',
        3,
        4.5,
        'Дуже лагідний кіт',
        'https://example.com/cat.jpg',
        userId
      ]
    )

    await db.runAsync(
      `INSERT INTO Animals (Name, Type, Breed, Age, Weight, Description, PhotoURL, UserId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Рекс',
        'Dog',
        'Labrador',
        5,
        25.0,
        'Активний пес, любить прогулянки',
        'https://example.com/dog.jpg',
        userId
      ]
    )
  }

  const dog = await db.getAsync(
    `SELECT Id FROM Animals
     WHERE UserId = ? AND Type = 'Dog'
     ORDER BY Id DESC
     LIMIT 1`,
    [userId]
  )

  const dogId = dog ? dog.Id : null
  if (dogId) {
    const existingDevice = await db.getAsync(
      'SELECT Id FROM SmartDevices WHERE DeviceGuid = ?',
      ['DEV-001']
    )

    if (!existingDevice) {
      await db.runAsync(
        'INSERT INTO SmartDevices (DeviceGuid, DogId, UserId) VALUES (?, ?, ?)',
        ['DEV-001', dogId, userId]
      )
    } else {
      await db.runAsync(
        'UPDATE SmartDevices SET DogId = ?, UserId = ? WHERE DeviceGuid = ?',
        [dogId, userId, 'DEV-001']
      )
    }
  }

  console.log('✅ Seed completed')
  console.log(`Demo login: ${demoEmail} / ${process.env.SEED_PASSWORD || 'Demo1234!'}`)
  console.log('SmartDevice: DEV-001')
}

module.exports = seed
