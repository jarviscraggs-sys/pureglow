import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const location = db.prepare("SELECT * FROM locations WHERE id = ?").get(session.locationId);
  return NextResponse.json(location);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const db = getDb();
  const body = await req.json();
  const {
    name, address, phone, email,
    hoursMon, hoursTue, hoursWed, hoursThu, hoursFri, hoursSat, hoursSun,
    uvDailyLimit
  } = body;

  db.prepare(`
    UPDATE locations SET
      name=?, address=?, phone=?, email=?,
      hours_mon=?, hours_tue=?, hours_wed=?, hours_thu=?, hours_fri=?, hours_sat=?, hours_sun=?,
      uv_daily_limit=?
    WHERE id=?
  `).run(name, address, phone, email, hoursMon, hoursTue, hoursWed, hoursThu, hoursFri, hoursSat, hoursSun, uvDailyLimit, session.locationId);

  return NextResponse.json({ ok: true });
}
