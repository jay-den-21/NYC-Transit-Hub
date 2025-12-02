import { promises as fs } from "node:fs";
import path from "node:path";

const GTFS_ROOT = path.resolve(process.cwd(), "GTFS_static_data/gtfs_subway");
const TRIPS_FILE = path.join(GTFS_ROOT, "trips.txt");
const SHAPES_FILE = path.join(GTFS_ROOT, "shapes.txt");

type TripRecord = {
  route_id: string;
  shape_id: string;
};

type ShapePoint = {
  lat: number;
  lon: number;
  sequence: number;
};

let cachedShapes: { [routeId: string]: [number, number][] } | null = null;

const parseCsv = (text: string): string[][] => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current);
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => (record[h] = cells[idx]));
    return record as any;
  });
};

const loadShapes = async (): Promise<{ [routeId: string]: [number, number][] }> => {
  if (cachedShapes) return cachedShapes;

  try {
    const tripsRaw = await fs.readFile(TRIPS_FILE, "utf-8");
    const shapesRaw = await fs.readFile(SHAPES_FILE, "utf-8");
    const trips = parseCsv(tripsRaw) as TripRecord[];
    const shapePointsRaw = parseCsv(shapesRaw) as any[];

    // Pick the most common shape_id per route_id
    const routeShapeCounts = new Map<string, Map<string, number>>();
    trips.forEach((t) => {
      if (!t.route_id || !t.shape_id) return;
      if (!routeShapeCounts.has(t.route_id)) {
        routeShapeCounts.set(t.route_id, new Map());
      }
      const m = routeShapeCounts.get(t.route_id)!;
      m.set(t.shape_id, (m.get(t.shape_id) ?? 0) + 1);
    });

    const routeToShape = new Map<string, string>();
    for (const [route, counts] of routeShapeCounts.entries()) {
      let bestShape = "";
      let bestCount = -1;
      counts.forEach((count, shapeId) => {
        if (count > bestCount) {
          bestCount = count;
          bestShape = shapeId;
        }
      });
      if (bestShape) routeToShape.set(route, bestShape);
    }

    // Build coordinates per shape_id
    const shapeToPoints = new Map<string, ShapePoint[]>();
    shapePointsRaw.forEach((row) => {
      const shapeId = row.shape_id;
      const lat = Number(row.shape_pt_lat);
      const lon = Number(row.shape_pt_lon);
      const seq = Number(row.shape_pt_sequence);
      if (!shapeId || !Number.isFinite(lat) || !Number.isFinite(lon)) return;
      if (!shapeToPoints.has(shapeId)) {
        shapeToPoints.set(shapeId, []);
      }
      shapeToPoints.get(shapeId)!.push({ lat, lon, sequence: Number.isFinite(seq) ? seq : 0 });
    });

    const routeShapes: { [routeId: string]: [number, number][] } = {};
    for (const [routeId, shapeId] of routeToShape.entries()) {
      const pts = shapeToPoints.get(shapeId);
      if (!pts || pts.length === 0) continue;
      pts.sort((a, b) => a.sequence - b.sequence);
      routeShapes[routeId] = pts.map((p) => [p.lat, p.lon]);
    }

    cachedShapes = routeShapes;
    return routeShapes;
  } catch (error) {
    console.warn("Unable to load GTFS route shapes", error);
    cachedShapes = {};
    return cachedShapes;
  }
};

export const getRouteShapes = async (): Promise<{ [routeId: string]: [number, number][] }> => {
  return loadShapes();
};
