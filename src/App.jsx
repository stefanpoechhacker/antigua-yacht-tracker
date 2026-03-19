import { useState, useEffect, useRef } from "react";
import YachtMap from "./YachtMap";
import YachtPanel from "./YachtPanel";
import Leaderboard from "./Leaderboard";
import { initialYachts, generateMovementDeltas, BOUNDS } from "./data/yachts";
import { useAISStream } from "./hooks/useAISStream";

const MAX_TRAIL = 30;

function bounce(val, min, max, heading, axis) {
  if (val < min || val > max) {
    return axis === "lat"
      ? { val: Math.max(min, Math.min(max, val)), heading: (360 - heading) % 360 }
      : { val: Math.max(min, Math.min(max, val)), heading: (540 - heading) % 360 };
  }
  return { val, heading };
}

const STATUS_COLORS = {
  idle: "#888",
  connecting: "#FFD700",
  connected: "#4CAF50",
  error: "#FF5252",
};

const STATUS_LABELS = {
  idle: "DEMO",
  connecting: "CONNECTING…",
  connected: "LIVE AIS",
  error: "RECONNECTING…",
};

export default function App() {
  // Live AIS data via server-side proxy
  const { vessels: liveVessels, status } = useAISStream();
  const isLive = status === "connected" && liveVessels.length > 0;

  // Mock data with simulated movement (always ticking)
  const [mockYachts, setMockYachts] = useState(() =>
    initialYachts.map((y) => ({
      ...y,
      trail: [[y.lat, y.lng]],
      speed_history: [y.speed],
    }))
  );
  const [liveCount, setLiveCount] = useState(0);
  const tickRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      setLiveCount((c) => c + 1);

      setMockYachts((prev) =>
        prev.map((yacht) => {
          const delta = generateMovementDeltas(yacht);
          let newLat = yacht.lat + delta.dlat;
          let newLng = yacht.lng + delta.dlng;
          let newHeading = (yacht.heading + delta.headingDrift + 360) % 360;
          let newSpeed = Math.max(0.5, Math.min(30, yacht.speed + delta.speedDrift));

          const latResult = bounce(newLat, BOUNDS.latMin, BOUNDS.latMax, newHeading, "lat");
          const lngResult = bounce(newLng, BOUNDS.lngMin, BOUNDS.lngMax, latResult.heading, "lng");
          newLat = latResult.val;
          newLng = lngResult.val;
          newHeading = lngResult.heading;

          const newTrail = [...yacht.trail, [newLat, newLng]].slice(-MAX_TRAIL);
          const newSpeedHistory = [...yacht.speed_history, newSpeed].slice(-20);

          return {
            ...yacht,
            lat: newLat,
            lng: newLng,
            heading: newHeading,
            speed: newSpeed,
            trail: newTrail,
            speed_history: newSpeedHistory,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Display: live vessels when connected, mock vessels otherwise
  const yachts = isLive ? liveVessels : mockYachts;

  const [selectedId, setSelectedId] = useState(null);
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);
  const selectedYacht = yachts.find((y) => y.id === selectedId) || null;

  const statusColor = STATUS_COLORS[status] || "#888";
  const statusLabel = STATUS_LABELS[status] || "DEMO";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#0a1628",
      fontFamily: "system-ui, -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.7; }
          100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      `}</style>

      {/* Top bar */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        background: "linear-gradient(180deg, rgba(10,22,40,0.98) 0%, transparent 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 800,
        pointerEvents: "none",
      }}>
        <div style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: 1,
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span>⚓</span>
          <span>Antigua Yacht Tracker</span>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: statusColor,
            background: `${statusColor}22`,
            border: `1px solid ${statusColor}55`,
            borderRadius: 20,
            padding: "2px 10px",
            letterSpacing: 0.5,
            animation: status === "connecting" || status === "error" ? "blink 1.2s infinite" : "none",
          }}>
            {isLive ? `🟢 ${statusLabel} · ${yachts.length} vessels` :
             status === "connecting" ? `🟡 ${statusLabel}` :
             status === "error" ? `🔴 ${statusLabel}` :
             `⚪ ${statusLabel} · ${yachts.length} vessels`}
          </span>
        </div>
      </div>


      {/* Map */}
      <div style={{ position: "absolute", inset: 0 }}>
        <YachtMap
          yachts={yachts}
          selectedId={selectedId}
          onSelectYacht={setSelectedId}
        />
      </div>

      {/* Leaderboard */}
      <Leaderboard
        yachts={yachts}
        selectedId={selectedId}
        onSelectYacht={setSelectedId}
        visible={leaderboardVisible}
        onToggle={() => setLeaderboardVisible((v) => !v)}
      />

      {/* Yacht detail panel */}
      {selectedYacht && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <YachtPanel
            yacht={selectedYacht}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}

      {/* Bottom status bar */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: selectedYacht ? 320 : 0,
        height: 36,
        background: "linear-gradient(0deg, rgba(10,22,40,0.95) 0%, transparent 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        fontSize: 11,
        color: "#555",
        zIndex: 800,
        transition: "right 0.3s",
      }}>
        <div>🌊 Antigua &amp; Barbuda · English Harbour · Falmouth Harbour</div>
        <div style={{ display: "flex", gap: 16 }}>
          {isLive ? (
            <span style={{ color: "#4CAF50" }}>🛰️ Live AIS · aisstream.io</span>
          ) : (
            <>
              <span>⛵ {yachts.filter((y) => y.type === "sailing").length} sailing</span>
              <span>⚡ {yachts.filter((y) => y.type === "motor").length} motor</span>
              <span>🛳️ {yachts.filter((y) => y.type === "superyacht").length} superyachts</span>
              <span style={{ color: "#333" }}>Updates: {liveCount}</span>
            </>
          )}
        </div>
      </div>

      {/* Click hint */}
      {!selectedId && (
        <div style={{
          position: "absolute",
          bottom: 48,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(10,22,40,0.9)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: "6px 16px",
          fontSize: 12,
          color: "#888",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          zIndex: 800,
        }}>
          {isLive
            ? "🛰️ Real AIS data — click any vessel for details"
            : "👆 Click any yacht to reveal its secrets"}
        </div>
      )}
    </div>
  );
}
