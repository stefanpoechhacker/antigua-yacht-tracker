import { useState } from "react";

const SORT_OPTIONS = [
  { key: "speed", label: "🚀 Fastest", getValue: (y) => y.speed },
  { key: "length", label: "📏 Biggest", getValue: (y) => y.length },
  { key: "wealth", label: "💰 Richest", getValue: (y) => {
    const f = y.owner.fortune;
    if (f === "Private" || f === "Old money" || f === "Academic wealth" || f === "Self-made" || f === "Comfortable") return 0;
    const m = f.match(/\$([0-9.]+)([BM])/);
    if (!m) return 0;
    return parseFloat(m[1]) * (m[2] === "B" ? 1000 : 1);
  }},
  { key: "year", label: "✨ Newest", getValue: (y) => y.year },
];

const typeColor = { superyacht: "#FF6B35", motor: "#4ECDC4", sailing: "#A8E6CF" };
const typeIcon = { superyacht: "🛳️", motor: "⚡", sailing: "⛵" };

export default function Leaderboard({ yachts, selectedId, onSelectYacht, visible, onToggle }) {
  const [sortKey, setSortKey] = useState("speed");
  const sorter = SORT_OPTIONS.find((s) => s.key === sortKey);
  const sorted = [...yachts].sort((a, b) => sorter.getValue(b) - sorter.getValue(a));

  return (
    <div style={{
      position: "absolute",
      top: 16,
      left: 16,
      width: visible ? 270 : 48,
      background: "rgba(10, 22, 40, 0.95)",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      overflow: "hidden",
      transition: "width 0.3s ease",
      zIndex: 900,
      fontFamily: "system-ui, sans-serif",
      color: "white",
    }}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "white",
          borderBottom: visible ? "1px solid rgba(255,255,255,0.08)" : "none",
        }}
      >
        <span style={{ fontSize: 18 }}>🏆</span>
        {visible && (
          <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
            Yacht Leaderboard
          </span>
        )}
        {visible && <span style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}>✕</span>}
      </button>

      {visible && (
        <>
          {/* Sort tabs */}
          <div style={{ display: "flex", gap: 4, padding: "8px 12px", flexWrap: "wrap" }}>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  background: sortKey === opt.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)",
                  color: sortKey === opt.key ? "white" : "#888",
                  fontWeight: sortKey === opt.key ? 700 : 400,
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Yacht list */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {sorted.map((yacht, i) => {
              const isSelected = yacht.id === selectedId;
              const color = typeColor[yacht.type];
              const val = sorter.getValue(yacht);
              const dispVal =
                sortKey === "speed" ? `${yacht.speed.toFixed(1)} kn`
                : sortKey === "length" ? `${yacht.length}m`
                : sortKey === "year" ? `${yacht.year}`
                : yacht.owner.fortune;

              return (
                <div
                  key={yacht.id}
                  onClick={() => onSelectYacht(yacht.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    cursor: "pointer",
                    background: isSelected ? `${color}22` : "transparent",
                    borderLeft: isSelected ? `3px solid ${color}` : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#555",
                    width: 18,
                    textAlign: "center",
                    flexShrink: 0,
                  }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </div>
                  <div style={{ fontSize: 16, flexShrink: 0 }}>{typeIcon[yacht.type]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {yacht.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#666", whiteSpace: "nowrap" }}>
                      {yacht.flag} {yacht.owner.name.split(" ")[0]}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>
                    {dispVal}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: "10px 14px", fontSize: 11, color: "#444", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {yachts.length} vessels tracked · Live
          </div>
        </>
      )}
    </div>
  );
}
