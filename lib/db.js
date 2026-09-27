const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

// Lazily-opened SQLite handle. The connection is NOT opened at import time.
// Next.js imports every route while building (`next build`), and opening the
// database during that pass fails ("Failed to collect page data"). Deferring
// the real open until the first query at request time keeps the build clean.
let realDb = null;

function getDb() {
  if (realDb) return realDb;

  const dbPath =
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "chalk.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  realDb = new DatabaseSync(dbPath);
  realDb.exec("PRAGMA journal_mode = WAL");
  realDb.exec("PRAGMA foreign_keys = ON");

  realDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'officer')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS officer_desk (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      note TEXT NOT NULL
    );
  `);

  try {
    require("./seed")();
  } catch (err) {
    console.error("Seed on first open failed:", err);
  }

  return realDb;
}

const db = new Proxy(
  {},
  {
    get(_target, prop) {
      const real = getDb();
      const value = real[prop];
      return typeof value === "function" ? value.bind(real) : value;
    }
  }
);

module.exports = db;
