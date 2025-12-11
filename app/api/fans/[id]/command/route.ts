import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decryptCreds, refreshAccessToken, sendCommand } from '@/app/api/_lib/atomberg';

const COOKIE_NAME = 'atomsync_creds';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  try {
    const creds = decryptCreds(token);
    const { accessToken, baseUrl } = await refreshAccessToken(creds);
    await sendCommand(accessToken, baseUrl, params.id, payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send command" }, { status: 500 });
  }
}

