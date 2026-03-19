import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ANTIGUA_CENTER, BOUNDS, generateMovementDeltas } from "./data/yachts";

// Custom yacht icons based on type
function createYachtIcon(type, heading, isSelected) {
  const colors = {
    superyacht: isSelected ? "#FFD700" : "#FF6B35",
    motor: isSelected ? "#FFD700" : "#4ECDC4",
    sailing: isSelected ? "#FFD700" : "#A8E6CF",
  };
  const color = colors[type] || "#4ECDC4";
  const size = type === "superyacht" ? 28 : 22;

  // SVG yacht shape pointing upward, rotated by heading
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="transform:rotate(${heading}deg);filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">
    <polygon points="12,2 18,20 12,16 6,20" fill="${color}" stroke="white" stroke-width="1.5"/>
    ${type === "sailing" ? `<line x1="12" y1="3" x2="12" y2="14" stroke="white" stroke-width="1.2"/>
    <polygon points="12,3 18,12 12,12" fill="white" opacity="0.6"/>` : ""}
    ${isSelected ? `<circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/>` : ""}
  </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Pulsing selected indicator
function createPulseIcon(type) {
  const colors = { superyacht: "#FF6B35", motor: "#4ECDC4", sailing: "#A8E6CF" };
  const color = colors[type] || "#4ECDC4";
  const html = `<div style="
    width:40px;height:40px;border-radius:50%;
    border:3px solid ${color};
    animation:pulse 1.5s ease-out infinite;
    opacity:0.7;
    transform:translate(-50%,-50%);
  "></div>`;
  return L.divIcon({ html, className: "", iconSize: [0, 0], iconAnchor: [0, 0] });
}

export default function YachtMap({ yachts, selectedId, onSelectYacht }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const trailsRef = useRef({});
  const pulseRef = useRef(null);

  // Init map
  useEffect(() => {
    if (mapInstance.current) return;
    const map = L.map(mapRef.current, {
      center: ANTIGUA_CENTER,
      zoom: 11,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Dark nautical tile layer
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    // Add secondary layer for richer coastline detail
    L.tileLayer(
      "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
      {
        attribution: '&copy; <a href="http://www.openseamap.org">OpenSeaMap</a>',
        opacity: 0.6,
      }
    ).addTo(map);

    mapInstance.current = map;
  }, []);

  // Update markers when yachts change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !yachts.length) return;

    yachts.forEach((yacht) => {
      const isSelected = yacht.id === selectedId;
      const icon = createYachtIcon(yacht.type, yacht.heading, isSelected);
      const pos = [yacht.lat, yacht.lng];

      if (markersRef.current[yacht.id]) {
        // Update existing marker
        markersRef.current[yacht.id].setLatLng(pos);
        markersRef.current[yacht.id].setIcon(icon);
      } else {
        // Create new marker
        const marker = L.marker(pos, { icon, zIndexOffset: isSelected ? 1000 : 0 })
          .addTo(map)
          .on("click", () => onSelectYacht(yacht.id));
        markersRef.current[yacht.id] = marker;
      }

      // Update trail
      if (yacht.trail && yacht.trail.length > 1) {
        if (trailsRef.current[yacht.id]) {
          map.removeLayer(trailsRef.current[yacht.id]);
        }
        const trailColor =
          yacht.type === "superyacht"
            ? "#FF6B35"
            : yacht.type === "motor"
            ? "#4ECDC4"
            : "#A8E6CF";
        trailsRef.current[yacht.id] = L.polyline(yacht.trail, {
          color: trailColor,
          weight: 2,
          opacity: 0.4,
          dashArray: "4 4",
        }).addTo(map);
      }
    });

    // Pulse ring on selected
    if (pulseRef.current) {
      map.removeLayer(pulseRef.current);
      pulseRef.current = null;
    }
    if (selectedId) {
      const sel = yachts.find((y) => y.id === selectedId);
      if (sel) {
        pulseRef.current = L.marker([sel.lat, sel.lng], {
          icon: createPulseIcon(sel.type),
          interactive: false,
          zIndexOffset: 500,
        }).addTo(map);
      }
    }
  }, [yachts, selectedId]);

  // Pan to selected yacht
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !selectedId) return;
    const sel = yachts.find((y) => y.id === selectedId);
    if (sel) {
      map.panTo([sel.lat, sel.lng], { animate: true, duration: 0.8 });
    }
  }, [selectedId]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100%", background: "#0a1628" }}
    />
  );
}
