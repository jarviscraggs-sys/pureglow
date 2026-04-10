import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const deals = db.prepare(
    "SELECT * FROM deals WHERE (location_id = ? OR location_id IS NULL) ORDER BY created_at DESC"
  ).all(session.locationId);

  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { name, description, discountType, discountValue, validFrom, validUntil } = await req.json();

  if (!name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const result = db.prepare(`
    INSERT INTO deals (location_id, name, description, discount_type, discount_value, valid_from, valid_until)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(session.locationId, name, description || null, discountType || null, discountValue || null, validFrom || null, validUntil || null);

  return NextResponse.json({ id: result.lastInsertRowid });
}
