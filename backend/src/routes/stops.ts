import express from "express";
import { getAllStops } from "../services/stopsLookup.js";
import { getStationVehicles } from "../repositories/feedRepository.js";
import { getPool } from "../db/pool.js";

const router = express.Router();

router.get("/", async (_req, res, next) => {
    try {
        const stops = await getAllStops();
        res.json(stops);
    } catch (error) {
        next(error);
    }
});

router.get("/:stationId/vehicles", async (req, res, next) => {
    const { stationId } = req.params;
    const pool = getPool();
    if (!pool) {
        return next(new Error("Database pool not available"));
    }
    try {
        const vehicles = await getStationVehicles(pool, stationId);
        res.json(vehicles);
    } catch (error) {
        next(error);
    }
});

export default router;
