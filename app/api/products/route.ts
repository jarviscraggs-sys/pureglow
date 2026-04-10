import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const products = db.prepare(
    "SELECT * FROM products WHERE (location_id = ? OR location_id IS NULL) AND is_active = 1 ORDER BY category, name"
  ).all(session.locationId);

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { name, description, price, stock, category } = await req.json();

  if (!name || price === undefined) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const result = db.prepare(`
    INSERT INTO products (location_id, name, description, price, stock, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(session.locationId, name, description || null, price, stock || 0, category || null);

  return NextResponse.json({ id: result.lastInsertRowid });
}
