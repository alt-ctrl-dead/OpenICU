import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { optionalAuth } from "../middleware/auth.js";
import { logAudit } from "../lib/audit.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-04-30.basil" as any });

function genPayCode() {
  return `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ── Step 1: Create a Stripe PaymentIntent ─────────────────
// Frontend calls this to get a client_secret for the Stripe Elements form
router.post("/create-intent", optionalAuth, async (req, res) => {
  try {
    const { reservationId, amount } = req.body;
    if (!reservationId) { res.status(400).json({ error: "reservationId required" }); return; }

    const reservation = await prisma.bedReservation.findUnique({
      where: { id: parseInt(reservationId) },
      include: { hospital: true },
    });
    if (!reservation) { res.status(404).json({ error: "Reservation not found" }); return; }

    const paymentAmount = amount || 10000; // ₹10,000 in paise = 1000000 paise? No — Stripe INR is in smallest unit (paise)
    const amountInPaise = paymentAmount * 100; // ₹10,000 = 1,000,000 paise

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: "inr",
      metadata: {
        reservationId: reservation.id.toString(),
        reservationCode: reservation.reservationCode,
        hospitalName: reservation.hospital.name,
        bedType: reservation.bedType,
      },
      description: `OpenICU Emergency Bed Reservation - ${reservation.hospital.name}`,
    });

    // Save a pending payment record
    const payment = await prisma.payment.create({
      data: {
        paymentCode: genPayCode(),
        userId: reservation.userId,
        reservationId: reservation.id,
        amount: paymentAmount,
        currency: "INR",
        method: "stripe",
        status: "pending",
      },
    });

    await logAudit({
      eventType: "payment_intent_created",
      actorType: "user",
      actorId: reservation.userId,
      entityType: "payment",
      entityId: payment.id,
      message: `Payment intent created for ₹${paymentAmount} at ${reservation.hospital.name}`,
      metadata: { paymentIntentId: paymentIntent.id, reservationCode: reservation.reservationCode },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id,
      amount: paymentAmount,
    });
  } catch (e: any) {
    console.error("Stripe create-intent error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Step 2: Confirm payment succeeded ─────────────────────
// Frontend calls this after Stripe.confirmPayment() succeeds
router.post("/confirm", optionalAuth, async (req, res) => {
  try {
    const { paymentIntentId, reservationId } = req.body;
    if (!paymentIntentId || !reservationId) {
      res.status(400).json({ error: "paymentIntentId and reservationId required" });
      return;
    }

    // Verify with Stripe that the payment actually succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      res.status(400).json({ error: `Payment not completed. Status: ${paymentIntent.status}` });
      return;
    }

    // Update reservation status
    const reservation = await prisma.bedReservation.update({
      where: { id: parseInt(reservationId) },
      data: {
        status: "pending_hospital_review",
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      },
      include: { hospital: true },
    });

    // Update payment record
    await prisma.payment.updateMany({
      where: { reservationId: parseInt(reservationId), status: "pending" },
      data: { status: "succeeded" },
    });

    await logAudit({
      eventType: "payment_confirmed",
      actorType: "stripe",
      actorId: null,
      entityType: "reservation",
      entityId: reservation.id,
      message: `Payment confirmed for reservation ${reservation.reservationCode} at ${reservation.hospital.name}`,
      metadata: { paymentIntentId, amount: paymentIntent.amount / 100 },
    });

    res.json({
      success: true,
      reservation: {
        id: reservation.id,
        reservationCode: reservation.reservationCode,
        status: reservation.status,
        expiresAt: reservation.expiresAt,
        hospital: { name: reservation.hospital.name, area: reservation.hospital.area },
      },
    });
  } catch (e: any) {
    console.error("Stripe confirm error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Legacy mock payment (still available for testing) ─────
router.post("/mock", optionalAuth, async (req, res) => {
  try {
    const { reservationId, amount, method } = req.body;
    if (!reservationId) { res.status(400).json({ error: "reservationId required" }); return; }

    const reservation = await prisma.bedReservation.findUnique({
      where: { id: parseInt(reservationId) },
      include: { hospital: true },
    });
    if (!reservation) { res.status(404).json({ error: "Reservation not found" }); return; }

    const payment = await prisma.payment.create({
      data: {
        paymentCode: genPayCode(),
        userId: reservation.userId,
        reservationId: reservation.id,
        amount: amount || 10000,
        currency: "INR",
        method: method || "upi",
        status: "mock_success",
      },
    });

    await prisma.bedReservation.update({
      where: { id: reservation.id },
      data: {
        status: "pending_hospital_review",
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
    });

    await logAudit({
      eventType: "payment_created",
      actorType: "user",
      actorId: reservation.userId,
      entityType: "payment",
      entityId: payment.id,
      message: `Mock payment ₹${amount || 10000} for reservation at ${reservation.hospital.name}`,
      metadata: { method, reservationCode: reservation.reservationCode },
    });

    res.json({ payment, reservation: { ...reservation, status: "pending_hospital_review" } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Get Stripe publishable key for frontend ───────────────
router.get("/config", (_req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

export default router;
