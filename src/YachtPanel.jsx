import { useState } from "react";

const typeEmoji = { superyacht: "🛥️", motor: "⚡", sailing: "⛵" };
const typeLabel = { superyacht: "Superyacht", motor: "Motor Yacht", sailing: "Sailing Yacht" };

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      border: `1px solid ${color}33`,
      borderRadius: 8,
      padding: "8px 12px",
      flex: "1 1 0",
      minWidth: 80,
    }}>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export default function YachtPanel({ yacht, onClose }) {
  const [factIndex, setFactIndex] = useState(0);
  if (!yacht) return null;

  const typeColor = yacht.type === "superyacht" ? "#FF6B35" : yacht.type === "motor" ? "#4ECDC4" : "#A8E6CF";
  const isLive = !!yacht.isLive;
  const fact = !isLive && yacht.owner ? yacht.owner.funFacts[factIndex % yacht.owner.funFacts.length] : null;

  return (
    <div style={{
      position: "absolute",
      top: 0,
      right: 0,
      width: 320,
      height: "100%",
      background: "linear-gradient(180deg, #0d1f3c 0%, #0a1628 100%)",
      borderLeft: `2px solid ${typeColor}44`,
      overflowY: "auto",
      zIndex: 1000,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.6)",
      fontFamily: "system-ui, sans-serif",
      color: "white",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: `1px solid ${typeColor}33`,
        background: `linear-gradient(135deg, ${typeColor}22 0%, transparent 100%)`,
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: 6,
            color: "white",
            cursor: "pointer",
            fontSize: 16,
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >✕</button>

        <div style={{ fontSize: 11, color: typeColor, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
          {typeLabel[yacht.type]}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          {yacht.name}
        </div>
        <div style={{ fontSize: 18, marginBottom: 4 }}>
          {yacht.flag} <span style={{ fontSize: 14, color: "#aaa" }}>MMSI {yacht.mmsi}</span>
        </div>
        <div style={{ fontSize: 13, color: "#888" }}>
          {yacht.year > 0 ? `Built ${yacht.year} · ` : ""}{yacht.length > 0 ? `${yacht.length}m` : ""}
          {isLive && <span style={{ marginLeft: 6, color: "#4CAF50", fontSize: 11, fontWeight: 600 }}>● LIVE AIS</span>}
        </div>
      </div>

      {/* Live stats */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 11, color: "#666", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Live Data</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <StatBadge label="Speed" value={`${yacht.speed.toFixed(1)} kn`} color={typeColor} />
          <StatBadge label="Heading" value={`${Math.round(yacht.heading)}°`} color="#9B9BFF" />
          <StatBadge label="Position" value={`${yacht.lat.toFixed(3)}N`} color="#7FBA00" />
        </div>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <StatBadge label="Latitude" value={`${yacht.lat.toFixed(4)}`} color="#7FBA00" />
          <StatBadge label="Longitude" value={`${yacht.lng.toFixed(4)}`} color="#7FBA00" />
        </div>
      </div>

      {/* Owner card — mock vessels only */}
      {!isLive && yacht.owner && (
        <>
          <div style={{
            margin: "0 20px 16px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 16px",
              background: "rgba(255,255,255,0.05)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}>
              <div style={{ fontSize: 36 }}>{yacht.owner.avatar}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{yacht.owner.name}</div>
                <div style={{ fontSize: 12, color: "#aaa" }}>{yacht.owner.nationality} · {yacht.owner.industry}</div>
                {yacht.owner.fortune !== "Private" && (
                  <div style={{ fontSize: 12, color: "#FFD700", fontWeight: 600 }}>Net worth: {yacht.owner.fortune}</div>
                )}
              </div>
            </div>
            <div style={{ padding: "12px 16px", fontSize: 13, lineHeight: 1.6, color: "#ccc" }}>
              {yacht.owner.bio}
            </div>
          </div>

          {/* Fun fact rotator */}
          <div style={{
            margin: "0 20px 16px",
            background: `linear-gradient(135deg, ${typeColor}18, rgba(255,215,0,0.08))`,
            border: `1px solid ${typeColor}44`,
            borderRadius: 12,
            padding: "14px 16px",
          }}>
            <div style={{ fontSize: 11, color: typeColor, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              ✨ Fun Fact
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#e0e0e0", minHeight: 60 }}>
              "{fact}"
            </div>
            <button
              onClick={() => setFactIndex(i => i + 1)}
              style={{
                marginTop: 10,
                background: `${typeColor}33`,
                border: `1px solid ${typeColor}66`,
                borderRadius: 6,
                color: typeColor,
                cursor: "pointer",
                fontSize: 12,
                padding: "4px 12px",
              }}
            >
              Another fact →
            </button>
          </div>
        </>
      )}

      {/* Live AIS vessel — no owner data */}
      {isLive && (
        <div style={{
          margin: "0 20px 16px",
          background: "rgba(76,175,80,0.06)",
          border: "1px solid rgba(76,175,80,0.25)",
          borderRadius: 12,
          padding: "14px 16px",
        }}>
          <div style={{ fontSize: 11, color: "#4CAF50", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
            🛰️ Real AIS Vessel
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "#aaa" }}>
            Live position data from the AIS transponder aboard this vessel via{" "}
            <span style={{ color: "#4ECDC4" }}>aisstream.io</span>.
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
            Owner information is not transmitted via AIS.
          </div>
        </div>
      )}

      {/* Trail info */}
      {yacht.trail && yacht.trail.length > 0 && (
        <div style={{ margin: "0 20px 20px", fontSize: 12, color: "#666" }}>
          <div style={{ marginBottom: 4, color: "#888" }}>📍 Tracking {yacht.trail.length} position updates</div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>
            Last seen: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
