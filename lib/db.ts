import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "pureglow.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      hours_mon TEXT DEFAULT '09:00-21:00',
      hours_tue TEXT DEFAULT '09:00-21:00',
      hours_wed TEXT DEFAULT '09:00-21:00',
      hours_thu TEXT DEFAULT '09:00-21:00',
      hours_fri TEXT DEFAULT '09:00-21:00',
      hours_sat TEXT DEFAULT '09:00-18:00',
      hours_sun TEXT DEFAULT '10:00-18:00',
      uv_daily_limit INTEGER DEFAULT 9,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS beds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER NOT NULL REFERENCES locations(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('laydown', 'standup')),
      status TEXT DEFAULT 'available' CHECK(status IN ('available', 'in_use', 'maintenance', 'offline')),
      minutes_remaining INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER REFERENCES locations(id),
      name TEXT NOT NULL,
      price REAL NOT NULL,
      minutes INTEGER NOT NULL,
      bed_type TEXT NOT NULL CHECK(bed_type IN ('all', 'standup')),
      is_unlimited BOOLEAN DEFAULT 0,
      daily_limit_mins INTEGER DEFAULT 9,
      duration_days INTEGER DEFAULT 30,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER REFERENCES locations(id),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      date_of_birth TEXT,
      skin_type INTEGER DEFAULT 1 CHECK(skin_type BETWEEN 1 AND 6),
      uv_total_mins INTEGER DEFAULT 0,
      notes TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customer_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      package_id INTEGER NOT NULL REFERENCES packages(id),
      minutes_remaining INTEGER NOT NULL,
      purchased_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      is_active BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER NOT NULL REFERENCES locations(id),
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      bed_id INTEGER NOT NULL REFERENCES beds(id),
      customer_package_id INTEGER REFERENCES customer_packages(id),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_mins INTEGER NOT NULL,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      created_by INTEGER REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER REFERENCES locations(id),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'staff' CHECK(role IN ('admin', 'manager', 'staff')),
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER REFERENCES locations(id),
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      category TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_id INTEGER REFERENCES locations(id),
      name TEXT NOT NULL,
      description TEXT,
      discount_type TEXT CHECK(discount_type IN ('percent', 'fixed')),
      discount_value REAL,
      valid_from TEXT,
      valid_until TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
