import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/auth.js";
import hospitalRoutes from "./routes/hospitals.js";
import reservationRoutes from "./routes/reservations.js";
import paymentRoutes from "./routes/payments.js";
import ambulanceRoutes from "./routes/ambulances.js";
import auditRoutes from "./routes/audit.js";
import statsRoutes from "./routes/stats.js";
import uploadRoutes from "./routes/uploads.js";
import recommendRoutes from "./routes/recommend.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "OpenICU Backend", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ambulances", ambulanceRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/recommend", recommendRoutes);

const PORT = parseInt(process.env.PORT || "5000");
app.listen(PORT, () => {
  console.log(`\n  OpenICU Backend running on http://localhost:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health\n`);
});
