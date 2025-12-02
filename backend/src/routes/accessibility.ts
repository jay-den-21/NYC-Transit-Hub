import { Router } from "express";
import { fetchAccessibilityData } from "../services/accessibility.js";

const router = Router();

router.get("/", async (req, res) => {
  const { stationId } = req.query;

  try {
    const data = await fetchAccessibilityData(
      typeof stationId === "string" ? stationId : undefined
    );
    return res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load accessibility data";
    return res.status(502).json({ error: message });
  }
});

export default router;
