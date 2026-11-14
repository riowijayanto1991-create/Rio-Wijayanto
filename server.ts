import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { analyzeHistoricalTrends, parseMonthlyPdfWithGemini, parseDutyRosterWithGemini } from "./server/geminiService";
import { getAirportWeather } from "./server/services/weatherService";
import { authRouter } from "./server/security/authRoutes";
import { authenticate } from "./server/security/authMiddleware";
import { whmpRouter } from "./server/routes/whmpRiskRoutes";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Body parser for JSON payloads
  app.use(express.json({ limit: "10mb" }));

  // Global authentication session resolver
  app.use(authenticate);

  // Health check endpoint for Cloud Run and container probes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication, User Management, Two-Person Approval, and Audit Log API
  app.use("/api", authRouter);

  // WHMP Chapter II Risk Model, Matrix, Species & Zones API
  app.use("/api", whmpRouter);

  // Current Weather & Bird Activity Conditions Endpoint for Airport WHMS
  app.get(["/api/weather", "/api/weather/:airportId"], async (req, res) => {
    try {
      const airportId = req.params.airportId || "WIII";
      const forceRefresh = req.query.refresh === "true" || req.query.refresh === "1";
      const weatherData = await getAirportWeather(airportId, forceRefresh);
      res.json(weatherData);
    } catch (error: any) {
      console.error("Error in /api/weather endpoint:", error);
      res.status(500).json({
        error: "Gagal mengambil data cuaca bandara WIII",
        message: error?.message || "Internal server error"
      });
    }
  });

  // Gemini Wildlife Hazard Trend Analysis API
  app.post("/api/gemini/analyze-trends", async (req, res) => {
    try {
      const payload = req.body || {};
      const result = await analyzeHistoricalTrends(payload);
      res.json(result);
    } catch (error: any) {
      console.error("Error in /api/gemini/analyze-trends:", error);
      res.status(500).json({
        error: "Gagal memproses analisis Gemini AI",
        message: error?.message || "Internal server error"
      });
    }
  });

  // Gemini WHMS Document & PDF Intelligent Parser API
  app.post("/api/gemini/parse-monthly-pdf", async (req, res) => {
    try {
      const { text, filename } = req.body || {};
      const result = await parseMonthlyPdfWithGemini({ text, filename });
      if (!result) {
        return res.status(404).json({ error: "AI parser tidak dapat mengekstrak data dari dokumen ini" });
      }
      res.json(result);
    } catch (error: any) {
      console.error("Error in /api/gemini/parse-monthly-pdf:", error);
      res.status(500).json({
        error: "Gagal memproses parsing dokumen AI",
        message: error?.message || "Internal server error"
      });
    }
  });

  // Gemini WHMS Duty Roster Parser API (Reads Nama, NIK, Pleton)
  app.post("/api/gemini/parse-duty-roster", async (req, res) => {
    try {
      const { text, filename } = req.body || {};
      const result = await parseDutyRosterWithGemini({ text, filename });
      if (!result) {
        return res.status(404).json({ error: "AI parser tidak dapat mengekstrak roster dari dokumen ini" });
      }
      res.json(result);
    } catch (error: any) {
      console.error("Error in /api/gemini/parse-duty-roster:", error);
      res.status(500).json({
        error: "Gagal memproses parsing roster AI",
        message: error?.message || "Internal server error"
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT, hmr: false },
      appType: "spa",
    });
    // Ensure index.html and service workers are not cached by browser in dev
    app.use((req, res, next) => {
      if (req.path === "/" || req.path.endsWith(".html") || req.path === "/sw.js") {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html") || filePath.endsWith("sw.js") || filePath.endsWith("registerSW.js") || filePath.endsWith("manifest.webmanifest")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else if (filePath.includes("/assets/")) {
          // Hashed assets can safely cache for 1 year
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    }));
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

