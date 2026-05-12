import { Router } from "express";
import Groq from "groq-sdk";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(date: Date): string {
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)}h ago`;
}

router.post("/", async (req, res) => {
  try {
    const { bedType, urgency, medicalSituation, patientLat, patientLng, description, maxDistanceKm } = req.body;

    if (!bedType) {
      res.status(400).json({ error: "bedType is required" });
      return;
    }

    const hospitals = await prisma.hospital.findMany({ include: { beds: true } });

    const candidateBedType = bedType === "icu" ? "ICU" : bedType === "cicu" ? "Cardiac ICU" : bedType === "nicu" ? "NICU" : bedType === "picu" ? "PICU" : bedType === "vent" ? "Ventilator Bed" : bedType === "er" ? "Emergency Ward" : bedType;

    const candidates = hospitals
      .map((h) => {
        const matchingBed = h.beds.find((b) => b.bedType === candidateBedType && b.availableBeds > 0);
        if (!matchingBed) return null;

        let distanceKm: number | null = null;
        if (patientLat && patientLng && h.latitude && h.longitude) {
          distanceKm = haversineKm(patientLat, patientLng, h.latitude, h.longitude);
        }

        const limit = maxDistanceKm || 50;
        if (distanceKm !== null && distanceKm > limit) return null;

        return {
          id: h.id,
          name: h.name,
          area: h.area,
          fullAddress: h.fullAddress,
          phone: h.phone,
          emergency: h.emergency,
          rating: h.rating,
          reviewCount: h.reviewCount,
          latitude: h.latitude,
          longitude: h.longitude,
          availableBeds: matchingBed.availableBeds,
          totalBeds: matchingBed.totalBeds,
          bedStatus: matchingBed.status,
          lastUpdated: timeAgo(matchingBed.lastUpdatedAt),
          distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
        };
      })
      .filter(Boolean);

    if (candidates.length === 0) {
      res.json({
        recommendations: [],
        aiReasoning: "No hospitals found with available beds matching your requirements within the search radius.",
        totalCandidates: 0,
      });
      return;
    }

    const prompt = `You are the OpenICU AI triage assistant. Analyze this emergency and rank the best hospitals.

EMERGENCY DETAILS:
- Required bed: ${candidateBedType}
- Urgency: ${urgency || "not specified"}
- Medical situation: ${medicalSituation || "not specified"}
- Additional notes: ${description || "none"}
- Patient coordinates: ${patientLat && patientLng ? `${patientLat}, ${patientLng}` : "not provided"}

AVAILABLE HOSPITALS (${candidates.length} with matching beds):
${JSON.stringify(candidates, null, 2)}

TASK: Rank the top 5 hospitals (or fewer if less available). For each, give a clear reason considering:
1. Distance from patient (closest is better for emergencies)
2. Bed availability count (more available = more reliable)
3. Hospital rating and review count
4. Data freshness (live > verified > stale)
5. Urgency match (critical = prioritize closest with beds)

Respond ONLY with valid JSON in this exact format:
{
  "rankings": [
    {
      "hospitalId": <number>,
      "rank": 1,
      "reason": "<1-2 sentence justification>"
    }
  ],
  "summary": "<1-2 sentence overall recommendation>"
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let aiResult: { rankings?: { hospitalId: number; rank: number; reason: string }[]; summary?: string };
    try {
      aiResult = JSON.parse(raw);
    } catch {
      aiResult = { rankings: [], summary: "AI parsing failed — showing hospitals sorted by distance and availability." };
    }

    const rankings = aiResult.rankings || [];

    const recommendations = rankings
      .map((r) => {
        const hospital = candidates.find((c) => c!.id === r.hospitalId);
        if (!hospital) return null;
        return { ...hospital, rank: r.rank, aiReason: r.reason };
      })
      .filter(Boolean);

    if (recommendations.length === 0) {
      const fallback = candidates
        .sort((a, b) => {
          if (a!.distanceKm !== null && b!.distanceKm !== null) return a!.distanceKm - b!.distanceKm;
          return b!.availableBeds - a!.availableBeds;
        })
        .slice(0, 5)
        .map((c, i) => ({ ...c, rank: i + 1, aiReason: "Ranked by distance and availability" }));

      res.json({
        recommendations: fallback,
        aiReasoning: "Fallback ranking by distance and availability.",
        totalCandidates: candidates.length,
      });
      return;
    }

    await logAudit({
      eventType: "ai_recommendation",
      actorType: "system",
      entityType: "recommendation",
      message: `AI recommended ${recommendations[0]?.name} for ${candidateBedType} (${urgency || "standard"})`,
      metadata: { bedType: candidateBedType, urgency, topHospitalId: recommendations[0]?.id },
    });

    res.json({
      recommendations,
      aiReasoning: aiResult.summary || "Hospitals ranked by AI analysis.",
      totalCandidates: candidates.length,
    });
  } catch (e: any) {
    console.error("AI recommendation error:", e);
    res.status(500).json({ error: "Recommendation engine failed", details: e.message });
  }
});

export default router;
