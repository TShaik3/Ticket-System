"use client";

import { useEffect, useRef, useState } from "react";

type Result = { status: string; name?: string; buyer?: string; ticketType?: string; at?: string };
type EventOpt = { id: string; title: string };

const MESSAGES: Record<string, { text: string; color: string }> = {
  ok: { text: "✅ Valid: let them in", color: "bg-green-600" },
  already_used: { text: "⚠️ Already checked in", color: "bg-amber-500" },
  invalid: { text: "❌ Ticket not found", color: "bg-red-600" },
  cancelled: { text: "❌ Ticket cancelled/refunded", color: "bg-red-600" },
  wrong_event: { text: "❌ Ticket is for a different event", color: "bg-red-600" },
  unauthorized: { text: "Please sign in again", color: "bg-red-600" },
};

export default function Scanner({ events }: { events: EventOpt[] }) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const [manual, setManual] = useState("");
  const [error, setError] = useState("");
  const eventRef = useRef(eventId);
  const lastRef = useRef({ code: "", t: 0 });
  useEffect(() => { eventRef.current = eventId; }, [eventId]);

  async function submit(code: string) {
    const now = Date.now();
    if (lastRef.current.code === code && now - lastRef.current.t < 4000) return; // ignore repeat frames
    lastRef.current = { code, t: now };
    try {
      const res = await fetch("/api/checkin", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, eventId: eventRef.current || undefined }),
      });
      setResult(await res.json());
      if (navigator.vibrate) navigator.vibrate(120);
    } catch {
      setResult({ status: "error" });
    }
  }

  useEffect(() => {
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      scanner = new Html5Qrcode("qr-reader");
      try {
        await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, (text) => submit(text), () => {});
      } catch {
        setError("Camera unavailable. Allow camera access, or type the ticket code below.");
      }
    })();
    return () => {
      cancelled = true;
      if (scanner?.isScanning) scanner.stop().then(() => scanner?.clear()).catch(() => {});
    };
  }, []);

  const msg = result ? MESSAGES[result.status] ?? { text: "Error: try again", color: "bg-red-600" } : null;

  return (
    <div className="space-y-4">
      {events.length > 1 && (
        <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      )}
      <div id="qr-reader" className="mx-auto w-full max-w-sm overflow-hidden rounded-xl" />
      {error && <p className="text-sm text-amber-600">{error}</p>}
      {msg && (
        <div className={`${msg.color} rounded-xl p-4 text-center text-white`} role="status">
          <p className="text-lg font-bold">{msg.text}</p>
          {result?.name && <p>{result.name}{result.ticketType ? ` · ${result.ticketType}` : ""}</p>}
          {result?.at && <p className="text-sm">at {new Date(result.at).toLocaleTimeString()}</p>}
        </div>
      )}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) { lastRef.current = { code: "", t: 0 }; submit(manual.trim()); setManual(""); } }}>
        <input className="input" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Type ticket code manually" />
        <button className="btn">Check</button>
      </form>
      <p className="text-sm text-muted">Backup: use the printed guest list or the guest list page to check people in by name.</p>
    </div>
  );
}
