import { promises as fs } from "node:fs";
import path from "node:path";

const GTFS_ROOT = path.resolve(process.cwd(), "GTFS_static_data/gtfs_subway");
const TRIPS_FILE = path.join(GTFS_ROOT, "trips.txt");
const STOP_TIMES_FILE = path.join(GTFS_ROOT, "stop_times.txt");

type TripRow = {
  route_id: string;
  trip_id: string;
};

type StopTimeRow = {
  trip_id: string;
  stop_id: string;
};

const parseCsv = (text: string): Record<string, string>[] => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cells: string[] = [];
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
    headers.forEach((h, idx) => {
      record[h] = cells[idx];
    });
    return record;
  });
};

let cachedRouteStops: { [routeId: string]: string[] } | null = null;
let cachedStopRoutes: { [stopId: string]: string[] } | null = null;

const buildRouteStops = async () => {
  try {
    const tripsRaw = await fs.readFile(TRIPS_FILE, "utf-8");
    const stopTimesRaw = await fs.readFile(STOP_TIMES_FILE, "utf-8");
    const trips = parseCsv(tripsRaw) as TripRow[];
    const stopTimes = parseCsv(stopTimesRaw) as StopTimeRow[];

    const tripToRoute = new Map<string, string>();
    trips.forEach((row) => {
      if (row.trip_id && row.route_id) {
        tripToRoute.set(row.trip_id, row.route_id);
      }
    });

    const routeStopSet = new Map<string, Set<string>>();
    stopTimes.forEach((row) => {
      const routeId = tripToRoute.get(row.trip_id);
      if (!routeId || !row.stop_id) return;
      if (!routeStopSet.has(routeId)) {
        routeStopSet.set(routeId, new Set());
      }
      routeStopSet.get(routeId)!.add(row.stop_id);
    });

    const routeStops: { [routeId: string]: string[] } = {};
    routeStopSet.forEach((set, route) => {
      routeStops[route] = Array.from(set);
    });

    const stopRoutes: { [stopId: string]: string[] } = {};
    routeStopSet.forEach((stopSet, route) => {
      stopSet.forEach((stopId) => {
        if (!stopRoutes[stopId]) stopRoutes[stopId] = [];
        stopRoutes[stopId].push(route);
      });
    });

    cachedRouteStops = routeStops;
    cachedStopRoutes = stopRoutes;
    return { routeStops, stopRoutes };
  } catch (error) {
    console.warn("Unable to load GTFS stop mappings", error);
    cachedRouteStops = {};
    cachedStopRoutes = {};
    return { routeStops: {}, stopRoutes: {} };
  }
};

export const getRouteStops = async (): Promise<{
  routeStops: { [routeId: string]: string[] };
  stopRoutes: { [stopId: string]: string[] };
}> => {
  if (cachedRouteStops && cachedStopRoutes) {
    return { routeStops: cachedRouteStops, stopRoutes: cachedStopRoutes };
  }
  return buildRouteStops();
};
