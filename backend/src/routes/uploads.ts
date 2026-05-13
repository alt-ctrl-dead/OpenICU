import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.post("/metadata", async (req, res) => {
  try {
    const { reservationId, fileName, fileType, uploadType } = req.body;
    if (!reservationId || !fileName || !uploadType) {
      res.status(400).json({ error: "reservationId, fileName, uploadType required" });
      return;
    }

    const upload = await prisma.medicalUpload.create({
      data: {
        reservationId: parseInt(reservationId),
        fileName,
        fileType: fileType || "application/pdf",
        uploadType,
        fileUrl: null,
      },
    });

    res.json(upload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
