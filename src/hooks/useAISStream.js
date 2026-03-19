import { useState, useEffect, useRef } from "react";

const POLL_INTERVAL = 60_000; // 60 seconds
const MAX_TRAIL = 30;

export function useAISStream() {
  const [vessels, setVessels] = useState({});
  const [status, setStatus] = useState("connecting");
  const prevRef = useRef({});
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function poll() {
      if (!mountedRef.current) return;
      try {
        const resp = await fetch("/api/ais");
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const { vessels: incoming } = await resp.json();

        if (!mountedRef.current) return;

        setVessels((prev) => {
          const next = { ...prev };
          for (const v of incoming) {
            const existing = next[v.id];
            const newTrail = existing
              ? [...existing.trail, [v.lat, v.lng]].slice(-MAX_TRAIL)
              : [[v.lat, v.lng]];
            const newSpeedHistory = existing
              ? [...existing.speed_history, v.speed].slice(-20)
              : [v.speed];
            next[v.id] = {
              ...v,
              trail: newTrail,
              speed_history: newSpeedHistory,
              lastSeen: Date.now(),
            };
          }
          // Preserve vessels seen in last 10 minutes not in this update
          const cutoff = Date.now() - 10 * 60 * 1000;
          for (const [id, v] of Object.entries(next)) {
            if (v.lastSeen < cutoff) delete next[id];
          }
          return next;
        });

        setStatus("connected");
      } catch {
        if (mountedRef.current) setStatus("error");
      }
    }

    poll();
    const timer = setInterval(poll, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, []);

  return { vessels: Object.values(vessels), status };
}
