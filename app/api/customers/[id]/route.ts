import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const packages = db.prepare(`
    SELECT cp.*, p.name as package_name, p.bed_type, p.is_unlimited, p.daily_limit_mins
    FROM customer_packages cp
    JOIN packages p ON cp.package_id = p.id
    WHERE cp.customer_id = ?
    ORDER BY cp.purchased_at DESC
  `).all(id);

  const bookings = db.prepare(`
    SELECT b.*, bd.name as bed_name, bd.type as bed_type, p.name as package_name
    FROM bookings b
    JOIN beds bd ON b.bed_id = bd.id
    LEFT JOIN customer_packages cp ON b.customer_package_id = cp.id
    LEFT JOIN packages p ON cp.package_id = p.id
    WHERE b.customer_id = ?
    ORDER BY b.start_time DESC
    LIMIT 50
  `).all(id);

  return NextResponse.json({ customer, packages, bookings });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const { firstName, lastName, email, phone, dateOfBirth, skinType, notes } = body;

  db.prepare(`
    UPDATE customers SET first_name=?, last_name=?, email=?, phone=?, date_of_birth=?, skin_type=?, notes=?
    WHERE id=?
  `).run(firstName, lastName, email || null, phone || null, dateOfBirth || null, skinType || 1, notes || null, id);

  return NextResponse.json({ ok: true });
}
