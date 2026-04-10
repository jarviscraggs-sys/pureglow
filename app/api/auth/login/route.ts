import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = getDb();
  const staff = db.prepare("SELECT * FROM staff WHERE email = ? AND is_active = 1").get(email) as {
    id: number; email: string; name: string; role: string; location_id: number; password_hash: string;
  } | undefined;

  if (!staff || !bcrypt.compareSync(password, staff.password_hash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSession({
    staffId: staff.id,
    email: staff.email,
    name: staff.name,
    role: staff.role,
    locationId: staff.location_id,
  });

  const response = NextResponse.json({ ok: true, name: staff.name, role: staff.role });
  response.cookies.set("pg_session", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 8,
    sameSite: "lax",
  });
  return response;
}
