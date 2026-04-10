import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const { customerId, packageId } = await req.json();

  if (!customerId || !packageId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const pkg = db.prepare("SELECT * FROM packages WHERE id = ?").get(packageId) as {
    minutes: number; duration_days: number;
  } | undefined;
  if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pkg.duration_days);

  const result = db.prepare(`
    INSERT INTO customer_packages (customer_id, package_id, minutes_remaining, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(customerId, packageId, pkg.minutes, expiresAt.toISOString().split("T")[0]);

  return NextResponse.json({ id: result.lastInsertRowid });
}
