import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { optionalAuth } from "../middleware/auth.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

function genCode() {
  return `AMB-BLR-${Math.floor(100000 + Math.random() * 900000)}`;
}

router.get("/", async (_req, res) => {
  try {
    const providers = await prisma.ambulanceProvider.findMany({ orderBy: { etaMinutes: "asc" } });
    res.json(providers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/requests", optionalAuth, async (req, res) => {
  try {
    const { providerId, purpose, ambulanceType, pickupCity, pickupArea, pickupAddress, pickupLandmark, destinationType, destinationHospitalId, destinationAddress, email } = req.body;

    let userId = req.user?.userId ?? null;
    if (!userId && email) {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({ data: { email, consentContact: true } });
      }
      userId = user.id;
    }

    const request = await prisma.ambulanceRequest.create({
      data: {
        requestCode: genCode(),
        userId,
        providerId: providerId ? parseInt(providerId) : null,
        purpose: purpose || "other",
        ambulanceType: ambulanceType || "Basic Life Support",
        pickupCity: pickupCity || null,
        pickupArea: pickupArea || null,
        pickupAddress: pickupAddress || null,
        pickupLandmark: pickupLandmark || null,
        destinationType: destinationType || null,
        destinationHospitalId: destinationHospitalId ? parseInt(destinationHospitalId) : null,
        destinationAddress: destinationAddress || null,
        status: "dispatch_requested",
      },
      include: { provider: true },
    });

    await logAudit({
      eventType: "ambulance_dispatch",
      actorType: "user",
      actorId: userId,
      entityType: "ambulance_request",
      entityId: request.id,
      message: `Ambulance dispatched: ${request.provider?.providerName || "unknown"} to ${pickupArea || "location"}`,
    });

    res.json(request);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/requests/:id", async (req, res) => {
  try {
    const request = await prisma.ambulanceRequest.findFirst({
      where: {
        OR: [
          { id: parseInt(req.params.id) || 0 },
          { requestCode: req.params.id },
        ],
      },
      include: { provider: true },
    });
    if (!request) { res.status(404).json({ error: "Ambulance request not found" }); return; }
    res.json(request);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/requests/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const request = await prisma.ambulanceRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include: { provider: true },
    });

    await logAudit({
      eventType: "ambulance_status_change",
      actorType: "system",
      entityType: "ambulance_request",
      entityId: request.id,
      message: `Ambulance request ${request.requestCode} status: ${status}`,
    });

    res.json(request);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
