import { Router } from "express";
import { geocodePlaces } from "../services/geocode.js";

const router = Router();

router.get("/", async (req, res) => {
  const { query } = req.query;

  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const results = await geocodePlaces(query, 6);
    return res.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to geocode query";
    return res.status(502).json({ error: message });
  }
});

export default router;
