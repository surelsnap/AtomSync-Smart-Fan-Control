import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decryptCreds, listFans, refreshAccessToken } from "../_lib/atomberg";

const COOKIE_NAME = "atomsync_creds";

export async function GET() {
  const jar = cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const creds = decryptCreds(token);
    const { accessToken, baseUrl } = await refreshAccessToken(creds);
    const data = await listFans(accessToken, baseUrl);
    const fans = Array.isArray((data as any)?.data) ? (data as any).data : (data as any).fans || data;
    return NextResponse.json({ fans });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch fans" }, { status: 500 });
  }
}

