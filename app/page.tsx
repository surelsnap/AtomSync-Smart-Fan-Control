"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import type { Fan } from "@/lib/types";

const formSchema = z.object({
  apiKey: z.string().min(4),
  refreshToken: z.string().min(4),
  baseUrl: z.string().url().optional()
});

export default function Page() {
  const qc = useQueryClient();
  const toast = useToast();
  const [apiKey, setApiKey] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://developer.atomberg-iot.com");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [demoMode, setDemoMode] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const { mutateAsync: saveSession, isPending: saving } = useMutation({
    mutationFn: async () => {
      const parsed = formSchema.parse({ apiKey, refreshToken, baseUrl });
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      if (!res.ok) throw new Error("Failed to save credentials");
    },
    onSuccess: async () => {
      toast.push({ title: "Credentials saved", variant: "success" });
      await qc.invalidateQueries({ queryKey: ["fans"] });
    },
    onError: (err: any) => {
      toast.push({ title: err.message || "Could not save credentials", variant: "error" });
    }
  });

  const { data, isFetching, error, refetch } = useQuery<{ fans: Fan[] }>({
    queryKey: ["fans", demoMode],
    queryFn: async () => {
      const url = demoMode ? "/api/demo/fans" : "/api/fans";
      const res = await fetch(url);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg = (json as any)?.error || "Unable to load fans";
        throw new Error(msg);
      }
      return res.json();
    },
    refetchInterval: demoMode ? 5000 : 8000
  });

  const { mutateAsync: runCommand, isPending: commanding } = useMutation({
    mutationFn: async (params: { id: string; payload: Partial<Fan> }) => {
      const res = await fetch(`/api/fans/${params.id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params.payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Command failed");
      }
    },
    onSuccess: async () => {
      toast.push({ title: "Updated fan", variant: "success" });
      await qc.invalidateQueries({ queryKey: ["fans"] });
    },
    onError: (err: any) => {
      toast.push({ title: err.message || "Could not update fan", variant: "error" });
    }
  });

  const fans = data?.fans || [];
  const telemetry = useMemo(
    () =>
      fans.map((f) => ({
        id: f.id,
        name: f.name,
        speed: f.speed,
        temperature: 24 + Math.random() * 6,
        powerUsage: (f as any).powerUsage ?? Math.round((f.speed || 0) * 12 + Math.random() * 5),
        lastUpdate: (f as any).lastUpdate || Date.now()
      })),
    [fans]
  );

  useEffect(() => {
    document.documentElement.className = theme === "light" ? "light" : "";
  }, [theme]);

  useEffect(() => {
    if (!voiceActive) return;
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast.push({ title: "Voice not supported in this browser", variant: "error" });
      setVoiceActive(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      setLogs((l) => [`Voice: ${transcript}`, ...l].slice(0, 50));
      const target = fans[0];
      if (!target) return;
      if (transcript.includes("turn on")) runCommand({ id: target.id, payload: { power: true } });
      if (transcript.includes("turn off")) runCommand({ id: target.id, payload: { power: false } });
      const speedMatch = transcript.match(/speed (\d)/);
      if (speedMatch) runCommand({ id: target.id, payload: { speed: Number(speedMatch[1]) } });
    };
    rec.onerror = () => setVoiceActive(false);
    rec.onend = () => setVoiceActive(false);
    rec.start();
    return () => rec.stop();
  }, [voiceActive, fans, runCommand, toast]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-col gap-2 pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">AtomSync</p>
        <h1 className="text-3xl font-semibold text-white">Control your Atomberg fans securely</h1>
        <p className="text-slate-400">Credentials are stored in an encrypted HTTP-only cookie; all calls go through the Express proxy.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-[320px,1fr]">
        <Card>
          <CardHeader className="flex flex-col items-start gap-2">
            <CardTitle>Login</CardTitle>
            <CardDescription>API Key & Refresh Token (kept server-side).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refreshToken">Refresh Token</Label>
              <Input
                id="refreshToken"
                type="password"
                placeholder="rt_..."
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-slate-500">Point this to your own proxy in production.</p>
            </div>
            <Button className="w-full" onClick={() => saveSession()} disabled={saving}>
              {saving ? "Saving..." : "Save & load fans"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={async () => {
                await fetch("/api/session", { method: "DELETE" });
                setApiKey("");
                setRefreshToken("");
                toast.push({ title: "Credentials cleared", variant: "info" });
              }}
            >
              Clear credentials
            </Button>
            <div className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2">
              <span className="text-sm text-slate-300">Demo mode</span>
              <Switch checked={demoMode} onChange={(e) => setDemoMode((e.target as HTMLInputElement).checked)} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2">
              <span className="text-sm text-slate-300">Light theme</span>
              <Switch checked={theme === "light"} onChange={(e) => setTheme((e.target as HTMLInputElement).checked ? "light" : "dark")} />
            </div>
            <Button variant={voiceActive ? "subtle" : "primary"} className="w-full" onClick={() => setVoiceActive((v) => !v)}>
              {voiceActive ? "Stop voice" : "Start voice commands"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Fans</CardTitle>
              <CardDescription>Online devices linked to your account.</CardDescription>
            </div>
            <Button variant="subtle" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent>
            {error && <p className="text-sm text-rose-300">{(error as any).message}</p>}
            {!fans.length && !isFetching && !error && (
              <p className="text-sm text-slate-400">Save credentials, then refresh to load fans.</p>
            )}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {fans.map((fan) => (
                <FanCard key={fan.id} fan={fan} onCommand={runCommand} busy={commanding} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AutomationPanel />
        <TelemetryPanel telemetry={telemetry} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Logs</CardTitle>
          <CardDescription>Recent events, voice intents, errors.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-slate-300">
          {logs.length === 0 && <p className="text-slate-500">No logs yet.</p>}
          {logs.map((log, idx) => (
            <div key={idx} className="rounded bg-white/5 px-3 py-2">
              {log}
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

function FanCard({
  fan,
  onCommand,
  busy
}: {
  fan: Fan;
  onCommand: (params: { id: string; payload: Partial<Fan> }) => Promise<void>;
  busy: boolean;
}) {
  const [speed, setSpeed] = useState(fan.speed ?? 0);
  const [mode, setMode] = useState(fan.mode || "normal");
  const [power, setPower] = useState(!!fan.power);

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{fan.online ? "Online" : "Offline"}</p>
          <h3 className="text-lg font-semibold text-white">{fan.name}</h3>
          <p className="text-sm text-slate-400">{fan.location || fan.id}</p>
        </div>
        <Switch checked={power} onChange={(e) => setPower((e.target as HTMLInputElement).checked)} />
      </div>
      <div className="mt-4 space-y-3">
        <div className="space-y-2">
          <Label>Speed: {speed}</Label>
          <input
            type="range"
            min={0}
            max={5}
            step={1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>
        <div className="space-y-2">
          <Label>Mode</Label>
          <Select value={mode} onChange={(e) => setMode(e.target.value as Fan["mode"])}>
            <option value="normal">Normal</option>
            <option value="sleep">Sleep</option>
            <option value="breeze">Breeze</option>
            <option value="turbo">Turbo</option>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          variant="subtle"
          size="sm"
          onClick={() => {
            setSpeed(fan.speed ?? 0);
            setMode(fan.mode || "normal");
            setPower(!!fan.power);
          }}
          disabled={busy}
        >
          Reset
        </Button>
        <Button
          size="sm"
          onClick={() => onCommand({ id: fan.id, payload: { speed, mode, power } })}
          disabled={busy}
        >
          {busy ? "Applying..." : "Apply"}
        </Button>
      </div>
    </div>
  );
}

function AutomationPanel() {
  const toast = useToast();
  const [time, setTime] = useState("22:00");
  const [condition, setCondition] = useState("temp>30");
  const [action, setAction] = useState("speed:2");
  const { data, refetch } = useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const res = await fetch("/api/automations");
      return res.json();
    }
  });

  const addRule = async () => {
    await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time, condition, action })
    });
    toast.push({ title: "Automation added", variant: "success" });
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Automations</CardTitle>
        <CardDescription>Create simple time/temp rules.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Time</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Condition</Label>
            <Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder='temp>30 or "always"' />
          </div>
          <div className="space-y-1">
            <Label>Action</Label>
            <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="speed:2, mode:sleep" />
          </div>
        </div>
        <Button size="sm" onClick={addRule}>
          Add rule
        </Button>
        <div className="space-y-2">
          {(data?.automations || []).map((a: any) => (
            <div key={a.id} className="rounded border border-white/5 px-3 py-2 text-sm text-slate-200">
              {a.time} · {a.condition} → {a.action}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TelemetryPanel({ telemetry }: { telemetry: { id: string; name: string; speed: number; temperature: number; powerUsage: number; lastUpdate: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Telemetry</CardTitle>
        <CardDescription>Speed / temperature / power.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {telemetry.map((t) => (
          <div key={t.id} className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>{t.name}</span>
              <span className="text-cyan-200">{t.powerUsage} W</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-800">
              <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${(t.speed / 5) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Speed {t.speed} · Temp {t.temperature.toFixed(1)}°C · Updated {new Date(t.lastUpdate).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

