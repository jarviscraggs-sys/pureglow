import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const locId = session.locationId;

  const bookings = db.prepare(`
    SELECT b.*, c.first_name, c.last_name, c.phone,
           bd.name as bed_name, bd.type as bed_type,
           p.name as package_name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN beds bd ON b.bed_id = bd.id
    LEFT JOIN customer_packages cp ON b.customer_package_id = cp.id
    LEFT JOIN packages p ON cp.package_id = p.id
    WHERE b.location_id = ? AND date(b.start_time) = ?
    ORDER BY b.start_time ASC
  `).all(locId, date);

  const beds = db.prepare("SELECT * FROM beds WHERE location_id = ? ORDER BY sort_order").all(locId);

  return NextResponse.json({ bookings, beds });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const body = await req.json();
  const { customerId, bedId, startTime, durationMins, customerPackageId, notes } = body;

  if (!customerId || !bedId || !startTime || !durationMins) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMins * 60000);

  const conflict = db.prepare(`
    SELECT id FROM bookings
    WHERE bed_id = ? AND status NOT IN ('cancelled', 'no_show')
    AND NOT (end_time <= ? OR start_time >= ?)
  `).get(bedId, start.toISOString(), end.toISOString());

  if (conflict) {
    return NextResponse.json({ error: "Bed already booked at this time" }, { status: 409 });
  }

  const result = db.prepare(`
    INSERT INTO bookings (location_id, customer_id, bed_id, customer_package_id, start_time, end_time, duration_mins, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    session.locationId, customerId, bedId, customerPackageId || null,
    start.toISOString(), end.toISOString(), durationMins, notes || null, session.staffId
  );

  return NextResponse.json({ id: result.lastInsertRowid });
}
