import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const locId = session.locationId;

  const customers = db.prepare(`
    SELECT c.*,
      (SELECT cp.minutes_remaining FROM customer_packages cp
       WHERE cp.customer_id = c.id AND cp.is_active = 1
       ORDER BY cp.purchased_at DESC LIMIT 1) as active_mins,
      (SELECT p.name FROM customer_packages cp
       JOIN packages p ON cp.package_id = p.id
       WHERE cp.customer_id = c.id AND cp.is_active = 1
       ORDER BY cp.purchased_at DESC LIMIT 1) as active_package
    FROM customers c
    WHERE c.location_id = ?
    AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)
    AND c.is_active = 1
    ORDER BY c.first_name ASC
  `).all(locId, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const body = await req.json();
  const { firstName, lastName, email, phone, dateOfBirth, skinType, notes } = body;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO customers (location_id, first_name, last_name, email, phone, date_of_birth, skin_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(session.locationId, firstName, lastName, email || null, phone || null, dateOfBirth || null, skinType || 1, notes || null);

  return NextResponse.json({ id: result.lastInsertRowid });
}
