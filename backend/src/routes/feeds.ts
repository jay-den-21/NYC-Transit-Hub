import { Router } from "express";
import { feedCatalog, getFeedDescriptor } from "../services/feedCatalog.js";
import { fetchFeedSnapshot } from "../services/mtaClient.js";
import { getPool } from "../db/pool.js";
import {
  deleteOlderThanMinutes,
  fetchLatestVehicles,
  fetchRecentVehicles,
  saveSnapshotVehicles
} from "../repositories/feedRepository.js";
import { getStopName } from "../services/stopsLookup.js";

const router = Router();

router.get("/", (_req, res) => {
  const feeds = feedCatalog.map(({ id, name, routes, mode }) => ({
    id,
    name,
    routes,
    mode
  }));

  res.json({ feeds });
});

router.get("/:feedId", async (req, res) => {
  const { feedId } = req.params;
  const { source, freshness } = req.query;
  const descriptor = getFeedDescriptor(feedId);

  if (!descriptor) {
    return res.status(404).json({ error: `Unknown feed: ${feedId}` });
  }

  const pool = getPool();
  const freshnessMinutes =
    typeof freshness === "string" && !Number.isNaN(Number(freshness))
      ? Number(freshness)
      : 60;

  const rowsToSnapshot = async (rows: any[]) => {
    const vehicles = [];
    for (const row of rows) {
      const stopName = row.stop_id ? await getStopName(row.stop_id) : null;
      vehicles.push({
        id: row.vehicle_id,
        routeId: row.route_id,
        stopId: row.stop_id,
        stopName: stopName ?? row.stop_name ?? null,
        currentStatus: row.current_status,
        directionId: row.direction_id,
        timestamp: row.vehicle_timestamp ? row.vehicle_timestamp.toISOString() : null,
        lat: row.lat,
        lon: row.lon,
        speedMph: row.speed_mph,
        label: row.label,
        isEstimatedPosition: Boolean(row.is_estimated_position)
      });
    }

    return {
      feedId: descriptor.id,
      name: descriptor.name,
      mode: descriptor.mode,
      routes: descriptor.routes,
      updatedAt: rows[0]?.captured_at ? new Date(rows[0].captured_at).toISOString() : null,
      entityCount: rows.length,
      vehicles
    };
  };

  if (source === "db") {
    if (!pool) {
      return res.status(400).json({ error: "Database is not configured" });
    }

    try {
      const rows = await fetchLatestVehicles(pool, descriptor.id);
      if (!rows.length) {
        return res.status(404).json({ error: "No data available in database" });
      }
      const snapshot = await rowsToSnapshot(rows);
      const hasPositions = snapshot.vehicles.some(
        (v) => typeof v.lat === "number" && typeof v.lon === "number"
      );
      if (hasPositions) {
        return res.json(snapshot);
      }
      // Fall back to live if DB rows lack positions
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to read database";
      return res.status(500).json({ error: message });
    }
  }

  if (pool) {
    try {
      const rows = await fetchRecentVehicles(pool, descriptor.id, freshnessMinutes);
      if (rows.length) {
        const snapshot = await rowsToSnapshot(rows);
        const hasPositions = snapshot.vehicles.some(
          (v) => typeof v.lat === "number" && typeof v.lon === "number"
        );
        if (hasPositions) {
          return res.json(snapshot);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("DB read failed, falling back to live feed", err);
    }
  }

  try {
    const snapshot = await fetchFeedSnapshot(descriptor.id);

    if (pool) {
      saveSnapshotVehicles(pool, snapshot).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn("Failed to persist snapshot", err);
      });
    }

    return res.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read feed";
    return res.status(502).json({ error: message });
  }
});

router.delete("/purge/yesterday", async (_req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(400).json({ error: "Database is not configured" });
  }

  try {
    const deleted = await deleteOlderThanMinutes(pool, 60);
    return res.json({ deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to purge data";
    return res.status(500).json({ error: message });
  }
});

export default router;
