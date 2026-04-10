import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  const body = await req.json();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (body.status !== undefined) { fields.push("status = ?"); values.push(body.status); }
  if (body.name !== undefined) { fields.push("name = ?"); values.push(body.name); }
  if (body.minutesRemaining !== undefined) { fields.push("minutes_remaining = ?"); values.push(body.minutesRemaining); }

  if (!fields.length) return NextResponse.json({ ok: true });

  values.push(id);
  db.prepare(`UPDATE beds SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  return NextResponse.json({ ok: true });
}
