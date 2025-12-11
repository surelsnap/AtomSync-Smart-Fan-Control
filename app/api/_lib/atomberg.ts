import crypto from "crypto";

const ALGO = "aes-256-gcm";
const KEY = (() => {
  const secret = process.env.AUTH_SECRET || "";
  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters");
  }
  return crypto.createHash("sha256").update(secret).digest();
})();

export type StoredCreds = {
  apiKey: string;
  refreshToken: string;
  baseUrl?: string;
};

export function encryptCreds(creds: StoredCreds): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const json = JSON.stringify(creds);
  const enc = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptCreds(token: string): StoredCreds {
  const raw = Buffer.from(token, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  return JSON.parse(dec);
}

export async function refreshAccessToken(creds: StoredCreds) {
  const baseUrl = (creds.baseUrl || process.env.ATOMBERG_BASE_URL || "https://developer.atomberg-iot.com").replace(/\/$/, "");
  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: creds.refreshToken,
      api_key: creds.apiKey
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refresh failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("No access_token returned");
  return { accessToken: json.access_token, baseUrl };
}

export async function listFans(accessToken: string, baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/v1/fans`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error(`Fans fetch failed: ${res.status}`);
  return res.json();
}

export async function sendCommand(accessToken: string, baseUrl: string, fanId: string, payload: any) {
  const res = await fetch(`${baseUrl}/api/v1/fans/${fanId}/command`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Command failed: ${res.status} ${text}`);
  }
  return res.json().catch(() => ({}));
}

