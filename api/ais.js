export const config = { runtime: "edge" };

// MarineTraffic public tile that covers the Eastern Caribbean
// (no API key needed — works from edge nodes)
const MT_TILE = "https://www.marinetraffic.com/getData/get_data_json_4/z:3/X:1/Y:1/station:0";

// Eastern Caribbean bounding box (covers Antigua, St Kitts, Guadeloupe, Barbuda area)
const BOUNDS = { latMin: 14.0, latMax: 19.5, lonMin: -65.5, lonMax: -58.0 };

const SHIP_TYPE_MAP = {
  1: "motor",   // Reserved
  2: "motor",   // WIG
  3: "motor",   // Fishing/tug/port tender
  4: "motor",   // HSC
  5: "motor",   // Special craft
  6: "superyacht", // Passenger (cruise ships)
  7: "motor",   // Cargo
  8: "motor",   // Tanker
  9: "sailing", // Other — includes pleasure craft/yachts
};

export default async function handler() {
  try {
    const resp = await fetch(MT_TILE, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.marinetraffic.com/",
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json, text/javascript, */*; q=0.01",
      },
      cf: { cacheTtl: 60 },
    });

    if (!resp.ok) {
      return Response.json({ error: `upstream ${resp.status}` }, { status: 502 });
    }

    const raw = await resp.json();
    const rows = raw?.data?.rows ?? [];

    const vessels = rows
      .filter((r) => {
        const lat = parseFloat(r.LAT);
        const lon = parseFloat(r.LON);
        return (
          lat >= BOUNDS.latMin && lat <= BOUNDS.latMax &&
          lon >= BOUNDS.lonMin && lon <= BOUNDS.lonMax
        );
      })
      .map((r) => {
        const lat = parseFloat(r.LAT);
        const lon = parseFloat(r.LON);
        const speed = parseInt(r.SPEED, 10) / 10; // tenths of a knot
        const course = parseInt(r.COURSE, 10);
        const heading = r.HEADING && r.HEADING !== "511" ? parseInt(r.HEADING, 10) : course;
        const shipType = parseInt(r.SHIPTYPE, 10);
        return {
          id: r.SHIP_ID,
          mmsi: r.SHIP_ID,
          name: (r.SHIPNAME || `Ship ${r.SHIP_ID}`).trim(),
          type: SHIP_TYPE_MAP[shipType] ?? "motor",
          lat,
          lng: lon,
          speed,
          heading,
          course,
          flag: r.FLAG || "",
          length: r.LENGTH ? parseInt(r.LENGTH, 10) : 0,
          elapsed: r.ELAPSED || 0,
          destination: r.DESTINATION || "",
          isLive: true,
        };
      });

    return Response.json(
      { vessels, updatedAt: Date.now() },
      {
        headers: {
          "Cache-Control": "public, max-age=60",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
