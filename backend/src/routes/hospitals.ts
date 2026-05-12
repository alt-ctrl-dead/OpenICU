import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: { beds: true },
      orderBy: { rating: "desc" },
    });

    const mapped = hospitals.map((h) => {
      const icuBed = h.beds.find((b) => b.bedType === "ICU");
      const ventBed = h.beds.find((b) => b.bedType === "Ventilator Bed");
      const totalAvail = h.beds.reduce((s, b) => s + b.availableBeds, 0);
      const bestStatus = h.beds.some((b) => b.status === "live") ? "Live" : h.beds.some((b) => b.status === "verified") ? "Verified" : "Stale";
      const lastUpdate = h.beds.reduce((latest, b) => (b.lastUpdatedAt > latest ? b.lastUpdatedAt : latest), h.lastUpdatedAt);

      return {
        id: h.id,
        name: h.name,
        shortName: h.shortName,
        category: h.category,
        type: h.type,
        area: h.area,
        city: h.city,
        fullAddress: h.fullAddress,
        pincode: h.pincode,
        landmark: h.landmark,
        phone: h.phone,
        emergency: h.emergency,
        email: h.email,
        website: h.website,
        rating: h.rating,
        reviewCount: h.reviewCount,
        totalBeds: h.totalBeds,
        icuBeds: h.icuBeds,
        verified: h.verified,
        latitude: h.latitude,
        longitude: h.longitude,
        imageUrl: h.imageUrl,
        departments: h.departments ? JSON.parse(h.departments) : [],
        facilities: h.facilities ? JSON.parse(h.facilities) : [],
        timings: h.timings ? JSON.parse(h.timings) : null,
        icu: icuBed?.availableBeds ?? 0,
        ven: ventBed?.availableBeds ?? 0,
        beds: totalAvail,
        status: bestStatus,
        updated: lastUpdate,
        inventory: h.beds.map((b) => ({
          id: b.id,
          bedType: b.bedType,
          totalBeds: b.totalBeds,
          availableBeds: b.availableBeds,
          ventilatorAvailable: b.ventilatorAvailable,
          status: b.status,
          lastUpdatedAt: b.lastUpdatedAt,
        })),
      };
    });

    res.json(mapped);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { beds: true },
    });
    if (!hospital) { res.status(404).json({ error: "Hospital not found" }); return; }

    const result = {
      ...hospital,
      departments: hospital.departments ? JSON.parse(hospital.departments) : [],
      facilities: hospital.facilities ? JSON.parse(hospital.facilities) : [],
      timings: hospital.timings ? JSON.parse(hospital.timings) : null,
      inventory: hospital.beds,
    };
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Hospital sync webhook — simulates real-time push from hospital systems
router.post("/sync", async (req, res) => {
  try {
    const { hospitalId, beds } = req.body;
    if (!hospitalId || !beds) { res.status(400).json({ error: "hospitalId and beds array required" }); return; }

    for (const bed of beds) {
      await prisma.bedInventory.updateMany({
        where: { hospitalId: parseInt(hospitalId), bedType: bed.bedType },
        data: {
          availableBeds: bed.availableBeds,
          totalBeds: bed.totalBeds ?? undefined,
          status: bed.status ?? "live",
          lastUpdatedAt: new Date(),
        },
      });
    }

    await prisma.hospital.update({ where: { id: parseInt(hospitalId) }, data: { lastUpdatedAt: new Date() } });

    const hospital = await prisma.hospital.findUnique({ where: { id: parseInt(hospitalId) } });
    await logAudit({
      eventType: "bed_update",
      actorType: "hospital",
      actorId: parseInt(hospitalId),
      entityType: "bed_inventory",
      entityId: parseInt(hospitalId),
      message: `Bed inventory synced at ${hospital?.name || hospitalId}`,
      metadata: { beds },
    });

    res.json({ success: true, message: "Inventory synced" });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
