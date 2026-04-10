#!/usr/bin/env node
// PureGlow startup + seed script

const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "pureglow.db");

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ────────────────────────────────────────────────────────────────────
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
    is_unlimited INTEGER DEFAULT 0,
    daily_limit_mins INTEGER DEFAULT 9,
    duration_days INTEGER DEFAULT 30,
    is_active INTEGER DEFAULT 1,
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
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER REFERENCES locations(id),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'staff' CHECK(role IN ('admin', 'manager', 'staff')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customer_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    package_id INTEGER NOT NULL REFERENCES packages(id),
    minutes_remaining INTEGER NOT NULL,
    purchased_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    is_active INTEGER DEFAULT 1
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

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER REFERENCES locations(id),
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    category TEXT,
    is_active INTEGER DEFAULT 1,
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
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ── Seed (idempotent) ─────────────────────────────────────────────────────────
const existing = db.prepare("SELECT COUNT(*) as c FROM locations").get();
if (existing.c > 0) {
  console.log("✓ Database already seeded — skipping");
  db.close();
  process.exit(0);
}

console.log("🌱 Seeding PureGlow database...");

// Location 1
const loc = db.prepare(`
  INSERT INTO locations (name, address, phone, email, hours_mon, hours_tue, hours_wed, hours_thu, hours_fri, hours_sat, hours_sun, uv_daily_limit)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  "PureGlow Sunderland",
  "12 High Street West, Sunderland, SR1 3EX",
  "0191 555 0123",
  "hello@pureglow.co.uk",
  "09:00-21:00",
  "09:00-21:00",
  "09:00-21:00",
  "09:00-21:00",
  "09:00-21:00",
  "09:00-18:00",
  "10:00-18:00",
  9
);
const locId = loc.lastInsertRowid;

// Beds
const beds = [
  { name: "Mega Sun P9S", type: "laydown", sort: 1 },
  { name: "Ergoline Bluvision", type: "laydown", sort: 2 },
  { name: "Ergoline Prestige Light Vision", type: "laydown", sort: 3 },
  { name: "Mega Sun 8000", type: "laydown", sort: 4 },
  { name: "Mega Sun 7800", type: "laydown", sort: 5 },
  { name: "Luxura V8 #1", type: "standup", sort: 6 },
  { name: "Luxura V8 #2", type: "standup", sort: 7 },
];
const bedStmt = db.prepare(
  "INSERT INTO beds (location_id, name, type, sort_order) VALUES (?, ?, ?, ?)"
);
const bedIds = beds.map((b) => bedStmt.run(locId, b.name, b.type, b.sort).lastInsertRowid);

// Packages
const packages = [
  { name: "Stand-up 60", price: 30, minutes: 60, bed_type: "standup", is_unlimited: 0, daily_limit_mins: 60, duration_days: 365 },
  { name: "Lay-down 60", price: 49, minutes: 60, bed_type: "all", is_unlimited: 0, daily_limit_mins: 60, duration_days: 365 },
  { name: "Lay-down 100", price: 60, minutes: 100, bed_type: "all", is_unlimited: 0, daily_limit_mins: 100, duration_days: 365 },
  { name: "Unlimited Monthly", price: 80, minutes: 9 * 30, bed_type: "all", is_unlimited: 1, daily_limit_mins: 9, duration_days: 30 },
];
const pkgStmt = db.prepare(`
  INSERT INTO packages (location_id, name, price, minutes, bed_type, is_unlimited, daily_limit_mins, duration_days)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const pkgIds = packages.map((p) =>
  pkgStmt.run(locId, p.name, p.price, p.minutes, p.bed_type, p.is_unlimited, p.daily_limit_mins, p.duration_days).lastInsertRowid
);

// Staff
const hash = bcrypt.hashSync("demo123", 10);
db.prepare(`
  INSERT INTO staff (location_id, name, email, password_hash, role)
  VALUES (?, ?, ?, ?, ?)
`).run(locId, "Admin User", "admin@pureglow.co.uk", hash, "admin");

db.prepare(`
  INSERT INTO staff (location_id, name, email, password_hash, role)
  VALUES (?, ?, ?, ?, ?)
`).run(locId, "Sarah Johnson", "sarah@pureglow.co.uk", bcrypt.hashSync("staff123", 10), "staff");

// Sample Customers
const customers = [
  { first_name: "Emma", last_name: "Thompson", email: "emma.t@example.com", phone: "07700 900001", skin_type: 2 },
  { first_name: "Jack", last_name: "Williams", email: "jack.w@example.com", phone: "07700 900002", skin_type: 3 },
  { first_name: "Sophie", last_name: "Brown", email: "sophie.b@example.com", phone: "07700 900003", skin_type: 2 },
  { first_name: "Liam", last_name: "Davis", email: "liam.d@example.com", phone: "07700 900004", skin_type: 4 },
  { first_name: "Olivia", last_name: "Wilson", email: "olivia.w@example.com", phone: "07700 900005", skin_type: 1 },
];
const custStmt = db.prepare(`
  INSERT INTO customers (location_id, first_name, last_name, email, phone, skin_type, uv_total_mins)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const today = new Date();
const todayStr = today.toISOString().split("T")[0];

const custIds = customers.map((c, i) => {
  const id = custStmt.run(locId, c.first_name, c.last_name, c.email, c.phone, c.skin_type, (i + 1) * 18).lastInsertRowid;

  // Give each customer an active package
  const pkgId = pkgIds[i % pkgIds.length];
  const pkg = packages[i % packages.length];
  const expiresAt = new Date(today);
  expiresAt.setDate(expiresAt.getDate() + pkg.duration_days);

  db.prepare(`
    INSERT INTO customer_packages (customer_id, package_id, minutes_remaining, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(id, pkgId, pkg.minutes, expiresAt.toISOString().split("T")[0]);

  return id;
});

// Sample Bookings for today
const bookingData = [
  { custIdx: 0, bedIdx: 0, hour: 10, dur: 12 },
  { custIdx: 1, bedIdx: 1, hour: 11, dur: 9 },
  { custIdx: 2, bedIdx: 5, hour: 12, dur: 9 },
  { custIdx: 3, bedIdx: 2, hour: 13, dur: 12 },
  { custIdx: 4, bedIdx: 6, hour: 14, dur: 9 },
];

const bkStmt = db.prepare(`
  INSERT INTO bookings (location_id, customer_id, bed_id, start_time, end_time, duration_mins, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

bookingData.forEach(({ custIdx, bedIdx, hour, dur }) => {
  const start = new Date(today);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + dur);
  bkStmt.run(
    locId,
    custIds[custIdx],
    bedIds[bedIdx],
    start.toISOString(),
    end.toISOString(),
    dur,
    "scheduled"
  );
});

// Products
const products = [
  { name: "Hawaiian Tropic Tanning Oil SPF 6", price: 12.99, stock: 24, category: "Tanning" },
  { name: "Millennium Tanning Solid Black", price: 14.99, stock: 18, category: "Tanning" },
  { name: "Designer Skin Bombshell", price: 22.99, stock: 12, category: "Tanning" },
  { name: "After-Sun Moisturiser", price: 9.99, stock: 30, category: "Aftercare" },
  { name: "Protective Goggles", price: 3.50, stock: 50, category: "Accessories" },
];
const prodStmt = db.prepare(`
  INSERT INTO products (location_id, name, price, stock, category) VALUES (?, ?, ?, ?, ?)
`);
products.forEach((p) => prodStmt.run(locId, p.name, p.price, p.stock, p.category));

// Deals
db.prepare(`
  INSERT INTO deals (location_id, name, description, discount_type, discount_value, valid_from, valid_until)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  locId,
  "Spring Glow Special",
  "20% off all lay-down packages this month",
  "percent",
  20,
  todayStr,
  new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]
);

console.log("✅ PureGlow seeded successfully!");
console.log("   Location: PureGlow Sunderland");
console.log("   Beds: 7 (5 lay-down, 2 stand-up)");
console.log("   Packages: 4");
console.log("   Staff: admin@pureglow.co.uk / demo123");
console.log("   Customers: 5 with bookings");

db.close();
