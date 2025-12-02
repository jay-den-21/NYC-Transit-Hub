import { promises as fs } from "node:fs";
import path from "node:path";

const STOPS_FILE = path.resolve(process.cwd(), "GTFS_static_data/gtfs_subway/stops.txt");

let stopNames: Map<string, string> | null = null;
let stopCoords: Map<string, { lat: number; lon: number }> | null = null;

const parseCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
};

const loadStops = async (): Promise<void> => {
  if (stopNames && stopCoords) return;

  try {
    const raw = await fs.readFile(STOPS_FILE, "utf-8");
    const lines = raw.split(/\r?\n/);
    const map = new Map<string, string>();
    const coordMap = new Map<string, { lat: number; lon: number }>();

    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i]?.trim();
      if (!line) continue;
      const [stopId, stopName, stopLat, stopLon] = parseCsvLine(line);
      if (stopId && stopName) {
        map.set(stopId, stopName);
        const lat = Number(stopLat);
        const lon = Number(stopLon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          coordMap.set(stopId, { lat, lon });
        }
      }
    }

    stopNames = map;
    stopCoords = coordMap;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Unable to load stops.txt for name lookup", error);
    stopNames = new Map();
    stopCoords = new Map();
  }
};

export const getStopName = async (stopId?: string | null): Promise<string | null> => {
  if (!stopId) return null;
  if (!stopNames) {
    await loadStops();
  }
  return stopNames?.get(stopId) ?? null;
};

export const getStopCoords = async (
  stopId?: string | null
): Promise<{ lat: number; lon: number } | null> => {
  if (!stopId) return null;
  if (!stopCoords) {
    await loadStops();
  }
  return stopCoords?.get(stopId) ?? null;
};

export const getAllStops = async (): Promise<{ id: string; name: string; lat: number; lon: number }[]> => {
    if (!stopCoords || !stopNames) {
        await loadStops();
    }

    const stops: { id: string; name: string; lat: number; lon: number }[] = [];
    if (stopCoords && stopNames) {
        for (const [stopId, coords] of stopCoords.entries()) {
            const name = stopNames.get(stopId);
            if (name) {
                stops.push({
                    id: stopId,
                    name,
                    lat: coords.lat,
                    lon: coords.lon,
                });
            }
        }
    }
    return stops;
};
