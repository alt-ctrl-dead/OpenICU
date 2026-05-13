import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const liveHospitals = await prisma.hospital.count();
    const allBeds = await prisma.bedInventory.findMany();
    const icuBedsTracked = allBeds.filter((b) => b.bedType === "ICU").reduce((s, b) => s + b.totalBeds, 0);
    const availableIcuBeds = allBeds.filter((b) => b.bedType === "ICU").reduce((s, b) => s + b.availableBeds, 0);
    const ambulancesNearby = await prisma.ambulanceProvider.count({ where: { status: "available" } });

    res.json({
      liveHospitals,
      icuBedsTracked,
      availableIcuBeds,
      totalBedsAvailable: allBeds.reduce((s, b) => s + b.availableBeds, 0),
      ambulancesNearby,
      avgResponseTime: "6 min",
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
