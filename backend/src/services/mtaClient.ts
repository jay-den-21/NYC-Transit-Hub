import { createRequire } from "node:module";
import type { FeedDescriptor, FeedId, FeedMode } from "./feedCatalog.js";
import { getFeedDescriptor } from "./feedCatalog.js";
import { getStopCoords, getStopName } from "./stopsLookup.js";

const apiKey = process.env.MTA_API_KEY;

// Use CommonJS require to avoid ESM interop issues with older versions of the bindings.
const require = createRequire(import.meta.url);
const transitRealtime = require("gtfs-realtime-bindings").transit_realtime;

export interface VehicleSummary {
  id: string;
  routeId?: string | null;
  stopId?: string | null;
  stopName?: string | null;
  currentStatus?: string | null;
  directionId?: number | null;
  timestamp?: string | null;
  lat?: number | null;
  lon?: number | null;
  speedMph?: number | null;
  label?: string | null;
  isEstimatedPosition?: boolean;
}

export interface FeedSnapshot {
  feedId: FeedId;
  name: string;
  mode: FeedMode;
  routes: string[];
  updatedAt: string | null;
  entityCount: number;
  vehicles: VehicleSummary[];
}

type TimestampInput = number | string | null | undefined;

const toIsoString = (value: TimestampInput): string | null => {
  if (value === undefined || value === null) return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? new Date(numericValue * 1000).toISOString()
    : null;
};

const buildSnapshot = async (
  feedId: FeedId,
  descriptor: FeedDescriptor,
  feed: any
): Promise<FeedSnapshot> => {
  const vehicles = (feed.entity ?? [])
    .filter((entity) => entity?.vehicle)
    .slice(0, 50)
    .map((entity, index) => {
      const vehicle = entity?.vehicle;
      const trip = vehicle?.trip;
      const position = vehicle?.position ?? null;
      const speedMps = position?.speed ?? null;
      const speedMph =
        speedMps === null || speedMps === undefined
          ? null
          : Math.round(Number(speedMps) * 2.23694 * 10) / 10;

      return {
        id: entity?.id ?? `${feedId}-${index}`,
        routeId: trip?.routeId ?? null,
        stopId: vehicle?.stopId ?? null,
        currentStatus: vehicle?.currentStatus ?? null,
        directionId: trip?.directionId ?? null,
        timestamp: toIsoString(vehicle?.timestamp),
        lat: position?.latitude ?? null,
        lon: position?.longitude ?? null,
        speedMph,
        label: vehicle?.vehicle?.label ?? trip?.tripId ?? null,
        stopName: null,
        isEstimatedPosition: false
      } satisfies VehicleSummary;
    });

  for (const v of vehicles) {
    if (v.stopId) {
      v.stopName = await getStopName(v.stopId);
    }
    if ((v.lat === null || v.lat === undefined) && v.stopId) {
      const coords = await getStopCoords(v.stopId);
      if (coords) {
        v.lat = coords.lat;
        v.lon = coords.lon;
        v.isEstimatedPosition = true;
      }
    }
  }

  return {
    feedId,
    name: descriptor.name,
    mode: descriptor.mode,
    routes: descriptor.routes,
    updatedAt: toIsoString((feed.header?.timestamp as TimestampInput | undefined) ?? null),
    entityCount: feed.entity?.length ?? 0,
    vehicles
  } satisfies FeedSnapshot;
};

export const fetchFeedSnapshot = async (feedId: FeedId): Promise<FeedSnapshot> => {
  const descriptor = getFeedDescriptor(feedId);

  if (!descriptor) {
    throw new Error(`Unknown feed: ${feedId}`);
  }

  const headers: Record<string, string> = {};
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const response = await fetch(descriptor.url, { headers });

  if (!response.ok) {
    throw new Error(`MTA feed request failed: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (!transitRealtime?.FeedMessage?.decode) {
    throw new Error("GTFS bindings failed to load");
  }

  const feedMessage = transitRealtime.FeedMessage.decode(buffer);
  const feedObject = transitRealtime.FeedMessage.toObject(feedMessage, {
    defaults: false
  });

  return buildSnapshot(feedId, descriptor, feedObject);
};
