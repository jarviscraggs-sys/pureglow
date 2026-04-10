import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const beds = db.prepare(
    "SELECT * FROM beds WHERE location_id = ? ORDER BY sort_order ASC"
  ).all(session.locationId);

  return NextResponse.json(beds);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { name, type } = await req.json();

  if (!name || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const maxSort = db.prepare("SELECT MAX(sort_order) as m FROM beds WHERE location_id = ?").get(session.locationId) as { m: number };
  const result = db.prepare(
    "INSERT INTO beds (location_id, name, type, sort_order) VALUES (?, ?, ?, ?)"
  ).run(session.locationId, name, type, (maxSort.m || 0) + 1);

  return NextResponse.json({ id: result.lastInsertRowid });
}
