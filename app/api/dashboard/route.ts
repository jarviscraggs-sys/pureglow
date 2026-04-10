import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const locId = session.locationId;
  const today = new Date().toISOString().split("T")[0];

  const todayBookings = db.prepare(`
    SELECT b.*, c.first_name, c.last_name, bd.name as bed_name, bd.type as bed_type
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN beds bd ON b.bed_id = bd.id
    WHERE b.location_id = ? AND date(b.start_time) = ?
    ORDER BY b.start_time ASC
  `).all(locId, today);

  const bedStatus = db.prepare(`
    SELECT * FROM beds WHERE location_id = ? ORDER BY sort_order ASC
  `).all(locId);

  const stats = {
    todayBookings: (todayBookings as unknown[]).length,
    revenue: (todayBookings as Array<{ duration_mins: number }>).reduce((acc) => acc, 0),
    activeCustomers: db.prepare("SELECT COUNT(*) as c FROM customers WHERE location_id = ? AND is_active = 1").get(locId) as { c: number },
    totalCustomers: db.prepare("SELECT COUNT(*) as c FROM customers WHERE location_id = ?").get(locId) as { c: number },
  };

  return NextResponse.json({ todayBookings, bedStatus, stats });
}
