import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const packages = db.prepare(
    "SELECT * FROM packages WHERE (location_id = ? OR location_id IS NULL) AND is_active = 1 ORDER BY price ASC"
  ).all(session.locationId);

  return NextResponse.json(packages);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const body = await req.json();
  const { name, price, minutes, bedType, isUnlimited, dailyLimitMins, durationDays } = body;

  if (!name || !price || !minutes) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO packages (location_id, name, price, minutes, bed_type, is_unlimited, daily_limit_mins, duration_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(session.locationId, name, price, minutes, bedType || "all", isUnlimited ? 1 : 0, dailyLimitMins || 9, durationDays || 365);

  return NextResponse.json({ id: result.lastInsertRowid });
}
