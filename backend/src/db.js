const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./data.sqlite");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    status TEXT,
    created_at TEXT,
    updated_at TEXT,
    assigned_to INTEGER
  )`);
});

module.exports = db;
