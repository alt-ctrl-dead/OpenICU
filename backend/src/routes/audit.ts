import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const events = await prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    res.json(events);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
