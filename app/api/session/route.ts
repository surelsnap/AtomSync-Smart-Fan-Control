import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { encryptCreds } from "../_lib/atomberg";

const bodySchema = z.object({
  apiKey: z.string().min(4),
  refreshToken: z.string().min(4),
  baseUrl: z.string().url().optional()
});

const COOKIE_NAME = "atomsync_creds";

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const token = encryptCreds(parsed.data);
  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}

