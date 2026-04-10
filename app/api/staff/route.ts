import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const staff = db.prepare(
    "SELECT id, name, email, role, is_active, created_at FROM staff WHERE location_id = ? ORDER BY name ASC"
  ).all(session.locationId);

  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const db = getDb();
  const { name, email, password, role } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO staff (location_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)
  `).run(session.locationId, name, email, hash, role || "staff");

  return NextResponse.json({ id: result.lastInsertRowid });
}
