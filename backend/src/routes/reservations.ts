import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { optionalAuth } from "../middleware/auth.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

function genCode() {
  return `OICU-BLR-${Math.floor(100000 + Math.random() * 900000)}`;
}

router.post("/", optionalAuth, async (req, res) => {
  try {
    const { hospitalId, bedType, urgency, medicalSituation, issueDescription, patientCity, patientArea, patientAddress, patientLandmark, latitude, longitude, email, phone, caregiverName } = req.body;

    let userId = req.user?.userId;

    if (!userId && email) {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({ data: { email, phone: phone || null, caregiverName: caregiverName || null, consentContact: true } });
      }
      userId = user.id;
    }

    if (!userId) { res.status(400).json({ error: "Authentication or email required" }); return; }
    if (!hospitalId || !bedType || !urgency) { res.status(400).json({ error: "hospitalId, bedType, urgency required" }); return; }

    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

    const reservation = await prisma.bedReservation.create({
      data: {
        reservationCode: genCode(),
        userId,
        hospitalId: parseInt(hospitalId),
        bedType,
        urgency,
        medicalSituation: medicalSituation || null,
        issueDescription: issueDescription || null,
        patientCity: patientCity || null,
        patientArea: patientArea || null,
        patientAddress: patientAddress || null,
        patientLandmark: patientLandmark || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: "payment_pending",
        expiresAt,
      },
      include: { hospital: true },
    });

    await logAudit({
      eventType: "reservation_created",
      actorType: "user",
      actorId: userId,
      entityType: "reservation",
      entityId: reservation.id,
      message: `Reservation request created for ${bedType} at ${reservation.hospital.name}`,
    });

    res.json(reservation);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const reservation = await prisma.bedReservation.findFirst({
      where: {
        OR: [
          { id: parseInt(req.params.id) || 0 },
          { reservationCode: req.params.id },
        ],
      },
      include: { hospital: true, uploads: true, payment: true },
    });
    if (!reservation) { res.status(404).json({ error: "Reservation not found" }); return; }
    res.json(reservation);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await prisma.bedReservation.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include: { hospital: true },
    });

    await logAudit({
      eventType: "reservation_status_change",
      actorType: "system",
      entityType: "reservation",
      entityId: reservation.id,
      message: `Reservation ${reservation.reservationCode} status changed to ${status}`,
    });

    res.json(reservation);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
