import { Pool } from "mysql2/promise";
import type { FeedId } from "../services/feedCatalog.js";
import type { FeedSnapshot, Vehicle } from "../services/mtaClient.js";
import { getPreviousStop, getTripStopSequence } from "../services/tripPlanner.js";
import { getStopCoords } from "../services/stopsLookup.js";

export const saveSnapshotVehicles = async (pool: Pool, snapshot: FeedSnapshot): Promise<void> => {
  if (!snapshot.vehicles.length) return;

  const capturedAt = new Date();
  const insertSql = `
    INSERT INTO feed_vehicle_positions
    (feed_id, vehicle_id, route_id, stop_id, stop_name, current_status, direction_id, vehicle_timestamp, lat, lon, speed_mph, label, is_estimated_position, captured_at)
    VALUES ?
  `;

  const processedVehicles = await Promise.all(snapshot.vehicles.map(async (v: Vehicle) => {
    let { lat, lon, isEstimatedPosition } = v;

    if (lat === null || lon === null) {
        const tripId = v.label;
        if (tripId && v.stopId) {
            const previousStop = await getPreviousStop(tripId, v.stopId);
            if (previousStop) {
                const prevStopCoords = await getStopCoords(previousStop.stop_id);
                const nextStopCoords = await getStopCoords(v.stopId);

                if (prevStopCoords && nextStopCoords) {
                    lat = (prevStopCoords.lat + nextStopCoords.lat) / 2;
                    lon = (prevStopCoords.lon + nextStopCoords.lon) / 2;
                    isEstimatedPosition = true;
                }
            }
        }
    }

    return [
      snapshot.feedId,
      v.id,
      v.routeId ?? null,
      v.stopId ?? null,
      v.stopName ?? null,
      v.currentStatus ?? null,
      v.directionId ?? null,
      v.timestamp ? new Date(v.timestamp) : null,
      lat,
      lon,
      v.speedMph ?? null,
      v.label ?? null,
      isEstimatedPosition ? 1 : 0,
      capturedAt
    ];
  }));

  await pool.query(insertSql, [processedVehicles]);
};

export interface StoredVehicleRow {
  vehicle_id: string;
  route_id: string | null;
  stop_id: string | null;
  stop_name: string | null;
  current_status: string | null;
  direction_id: number | null;
  vehicle_timestamp: Date | null;
  lat: number | null;
  lon: number | null;
  speed_mph: number | null;
  label: string | null;
  is_estimated_position: number;
  captured_at: Date;
}

export const fetchLatestVehicles = async (
  pool: Pool,
  feedId: FeedId,
  limit = 50
): Promise<StoredVehicleRow[]> => {
  const sql = `
    SELECT vehicle_id, route_id, stop_id, stop_name, current_status, direction_id, vehicle_timestamp,
           lat, lon, speed_mph, label, is_estimated_position, captured_at
    FROM feed_vehicle_positions
    WHERE feed_id = ?
    ORDER BY vehicle_timestamp DESC, captured_at DESC
    LIMIT ?
  `;

  const [rows] = await pool.query(sql, [feedId, limit]);
  return rows as StoredVehicleRow[];
};

export const fetchRecentVehicles = async (
  pool: Pool,
  feedId: FeedId,
  freshnessMinutes = 2,
  limit = 100
): Promise<StoredVehicleRow[]> => {
  const since = new Date(Date.now() - freshnessMinutes * 60 * 1000);
  const sql = `
    SELECT vehicle_id, route_id, stop_id, stop_name, current_status, direction_id, vehicle_timestamp,
           lat, lon, speed_mph, label, is_estimated_position, captured_at
    FROM feed_vehicle_positions
    WHERE feed_id = ? AND captured_at >= ?
    ORDER BY captured_at DESC, vehicle_timestamp DESC
    LIMIT ?
  `;

  const [rows] = await pool.query(sql, [feedId, since, limit]);
  return rows as StoredVehicleRow[];
};

export const deleteOlderThanMinutes = async (pool: Pool, minutes = 60): Promise<number> => {
  const sql = `
    DELETE FROM feed_vehicle_positions
    WHERE captured_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
  `;

  const [result] = await pool.query(sql, [minutes]);
  const { affectedRows } = result as { affectedRows: number };
  return affectedRows;
};

export const getStationVehicles = async (pool: Pool, stationId: string): Promise<{ upcoming: StoredVehicleRow[], past: StoredVehicleRow[] }> => {
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const sql = `
        SELECT DISTINCT label
        FROM feed_vehicle_positions
        WHERE captured_at >= ?
    `;

    const [rows] = await pool.query(sql, [since]);
    const tripIds = (rows as { label: string }[]).map(r => r.label);

    const upcoming: StoredVehicleRow[] = [];
    const past: StoredVehicleRow[] = [];

    for (const tripId of tripIds) {
        if (!tripId) continue;
        const sequence = await getTripStopSequence(tripId);
        if (!sequence) {
            continue;
        }

        const stationIndex = sequence.findIndex(s => s.stop_id === stationId);
        if (stationIndex === -1) {
            continue;
        }

        const vehicleSql = `
            SELECT *
            FROM feed_vehicle_positions
            WHERE label = ? AND captured_at >= ?
            ORDER BY vehicle_timestamp DESC
            LIMIT 1
        `;
        const [vehicleRows] = await pool.query(vehicleSql, [tripId, since]);
        if ((vehicleRows as StoredVehicleRow[]).length === 0) {
            continue;
        }

        const vehicle = (vehicleRows as StoredVehicleRow[])[0];
        const vehicleStopIndex = sequence.findIndex(s => s.stop_id === vehicle.stop_id);

        if (vehicleStopIndex < stationIndex) {
            upcoming.push(vehicle);
        } else if (vehicleStopIndex > stationIndex) {
            past.push(vehicle);
        }
    }

    return { upcoming, past };
}
