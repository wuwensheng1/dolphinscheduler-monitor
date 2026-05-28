import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'config.db');

let db: Database;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

export async function initLocalDb() {
  ensureDataDir();
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 3306,
      database_name TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      db_type TEXT NOT NULL DEFAULT 'mysql',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS indicators (
      id TEXT PRIMARY KEY,
      env_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      sql_text TEXT NOT NULL,
      result_type TEXT NOT NULL DEFAULT 'number',
      min_value REAL,
      max_value REAL,
      min_sql TEXT,
      max_sql TEXT,
      weight REAL DEFAULT 1.0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (env_id) REFERENCES environments(id)
    )
  `);

  saveDb();
  console.log('Local config database initialized');
}

export function getDb(): Database {
  return db;
}

export function saveDatabase() {
  saveDb();
}
