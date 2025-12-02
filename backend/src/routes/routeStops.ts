import { Router } from "express";
import { getRouteStops } from "../services/routeStops.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const data = await getRouteStops();
    return res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load route stops";
    return res.status(500).json({ error: message, routeStops: {}, stopRoutes: {} });
  }
});

export default router;
