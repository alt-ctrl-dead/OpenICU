import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { signToken, authMiddleware } from "../middleware/auth.js";
import { logAudit } from "../lib/audit.js";
import bcrypt from "bcryptjs";

const router = Router();

// ── Sign Up ────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password, caregiverName, consentContact } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Full name is required" });
      return;
    }
    if (!email || !email.trim()) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "An account with this email already exists. Please sign in." });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || null,
        caregiverName: caregiverName || null,
        consentContact: consentContact ?? true,
        passwordHash,
      },
    });

    await logAudit({
      eventType: "user_signup",
      actorType: "user",
      actorId: user.id,
      entityType: "user",
      entityId: user.id,
      message: `New user signed up: ${user.name} (${email})`,
    });

    const token = signToken({ userId: user.id, email: user.email });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        caregiverName: user.caregiverName,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Login ──────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    if (!password) {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      res.status(404).json({ error: "No account found with this email. Please sign up first." });
      return;
    }

    // Verify password (skip check for legacy accounts with empty hash)
    if (user.passwordHash && user.passwordHash !== "") {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Incorrect password. Please try again." });
        return;
      }
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        caregiverName: user.caregiverName,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Get Current User ───────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      caregiverName: user.caregiverName,
      consentContact: user.consentContact,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Update Location ────────────────────────────────────────
router.patch("/location", authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: "latitude and longitude are required" });
      return;
    }

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        lastLat: parseFloat(latitude),
        lastLng: parseFloat(longitude),
      },
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
