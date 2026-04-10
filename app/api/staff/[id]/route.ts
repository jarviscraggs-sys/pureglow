import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  const body = await req.json();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.name) { fields.push("name = ?"); values.push(body.name); }
  if (body.role) { fields.push("role = ?"); values.push(body.role); }
  if (body.isActive !== undefined) { fields.push("is_active = ?"); values.push(body.isActive ? 1 : 0); }
  if (body.password) { fields.push("password_hash = ?"); values.push(bcrypt.hashSync(body.password, 10)); }

  if (!fields.length) return NextResponse.json({ ok: true });

  values.push(id);
  db.prepare(`UPDATE staff SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  return NextResponse.json({ ok: true });
}
