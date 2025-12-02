import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import feedsRouter from "./routes/feeds.js";
import stopsRouter from "./routes/stops.js";
import geocodeRouter from "./routes/geocode.js";
import accessibilityRouter from "./routes/accessibility.js";
import routeShapesRouter from "./routes/routeShapes.js";
import { initializeDatabase } from "./db/dbManager.js";
import { getPool } from "./db/pool.js";
import { deleteOlderThanMinutes } from "./repositories/feedRepository.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/feeds", feedsRouter);
app.use("/api/stops", stopsRouter);
app.use("/api/geocode", geocodeRouter);
app.use("/api/accessibility", accessibilityRouter);
app.use("/api/route-shapes", routeShapesRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Fallback error handler to avoid exposing stack traces in responses
  const message = err instanceof Error ? err.message : "Unexpected server error";
  res.status(500).json({ error: message });
});

const startServer = async () => {
  await initializeDatabase();

  const pool = getPool();
  if (pool) {
    setInterval(() => {
      deleteOlderThanMinutes(pool)
        .then(deletedRows => {
          if (deletedRows > 0) {
            console.log(`Cleaned up ${deletedRows} old vehicle positions.`);
          }
        })
        .catch(error => {
          console.error("Error cleaning up old vehicle positions:", error);
        });
    }, 60 * 1000); // Run every minute
  }


  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`);
  });
};

startServer();
