const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const axios = require("axios");

const PORT = process.env.PORT || 4000;
const AUTH_SECRET = process.env.AUTH_SECRET || "";
const ATOMBERG_BASE_URL = (process.env.ATOMBERG_BASE_URL || "https://developer.atomberg-iot.com").replace(/\/$/, "");

if (AUTH_SECRET.length < 32) {
  console.error("AUTH_SECRET must be set to a random string >= 32 chars");
  process.exit(1);
}

const ALGO = "aes-256-gcm";
const KEY = crypto.createHash("sha256").update(AUTH_SECRET).digest();

function encryptCreds(creds) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const json = JSON.stringify(creds);
  const enc = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decryptCreds(token) {
  const raw = Buffer.from(token, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  return JSON.parse(dec);
}

async function refreshAccessToken(creds) {
  const res = await axios.post(`${creds.baseUrl || ATOMBERG_BASE_URL}/oauth/token`, {
    grant_type: "refresh_token",
    refresh_token: creds.refreshToken,
    api_key: creds.apiKey
  });
  if (!res.data?.access_token) throw new Error("No access_token returned");
  return res.data.access_token;
}

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use(express.json());

const COOKIE_NAME = "atomsync_creds";

// Session: store encrypted creds in HTTP-only cookie
app.post("/api/session", (req, res) => {
  const { apiKey, refreshToken, baseUrl } = req.body || {};
  if (!apiKey || !refreshToken) return res.status(400).json({ error: "Missing credentials" });
  const token = encryptCreds({ apiKey, refreshToken, baseUrl: baseUrl || ATOMBERG_BASE_URL });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/"
  });
  res.json({ ok: true });
});

app.delete("/api/session", (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

// List fans
app.get("/api/fans", async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const creds = decryptCreds(token);
    const accessToken = await refreshAccessToken(creds);
    const list = await axios.get(`${creds.baseUrl || ATOMBERG_BASE_URL}/api/v1/fans`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const fans = Array.isArray(list.data?.data) ? list.data.data : list.data?.fans || list.data;
    res.json({ fans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch fans" });
  }
});

// Send command
app.post("/api/fans/:id/command", async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const creds = decryptCreds(token);
    const accessToken = await refreshAccessToken(creds);
    await axios.post(`${creds.baseUrl || ATOMBERG_BASE_URL}/api/v1/fans/${req.params.id}/command`, req.body, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || "Failed to send command" });
  }
});

// Simple automation store in-memory (demo)
const automations = [];
app.get("/api/automations", (req, res) => res.json({ automations }));
app.post("/api/automations", (req, res) => {
  const item = { id: crypto.randomUUID(), ...req.body };
  automations.push(item);
  res.json({ automation: item });
});
app.delete("/api/automations/:id", (req, res) => {
  const idx = automations.findIndex((a) => a.id === req.params.id);
  if (idx >= 0) automations.splice(idx, 1);
  res.json({ ok: true });
});

// Demo data
app.get("/api/demo/fans", (_req, res) => {
  res.json({
    fans: [
      { id: "demo-1", name: "Living Room", online: true, speed: 3, mode: "breeze", power: true, powerUsage: 42, lastUpdate: Date.now() },
      { id: "demo-2", name: "Bedroom", online: true, speed: 2, mode: "sleep", power: true, powerUsage: 28, lastUpdate: Date.now() },
      { id: "demo-3", name: "Office", online: false, speed: 0, mode: "normal", power: false, powerUsage: 0, lastUpdate: Date.now() - 3600_000 }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`AtomSync proxy running on http://localhost:${PORT}`);
});

