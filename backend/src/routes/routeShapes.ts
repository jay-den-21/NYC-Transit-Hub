import { Router } from "express";
import { getRouteShapes } from "../services/routeShapes.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const shapes = await getRouteShapes();
    return res.json({ shapes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load route shapes";
    return res.status(500).json({ error: message, shapes: {} });
  }
});

export default router;
