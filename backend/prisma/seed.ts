import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const BED_TYPES = ["ICU", "Cardiac ICU", "NICU", "PICU", "Ventilator Bed", "Emergency Ward"];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("Seeding OpenICU database...");

  // Load hospital JSON
  const raw = JSON.parse(readFileSync(resolve(__dirname, "../../hospitals.json"), "utf8"));
  const hospitals: any[] = raw.hospitals;

  // Seed hospitals
  for (const h of hospitals) {
    const phone = h.contact?.phone?.[0] || h.contact?.mobile || null;
    const emergency = h.contact?.emergency?.[0] || phone;
    const email = h.contact?.email?.[0] || null;
    const website = h.contact?.website || null;
    const rating = parseFloat((3.5 + Math.random() * 1.5).toFixed(1));
    const reviewCount = randInt(500, 8000);

    const hospital = await prisma.hospital.create({
      data: {
        name: h.name,
        shortName: h.short_name || null,
        category: h.category || "Private",
        type: h.type || "Multispecialty",
        area: h.address?.area || "Bengaluru",
        city: h.address?.city || "Bengaluru",
        fullAddress: h.address?.full || "",
        pincode: h.address?.pincode || null,
        landmark: h.address?.landmark || null,
        phone,
        emergency,
        email,
        website,
        rating,
        reviewCount,
        totalBeds: h.capacity?.total_beds || randInt(50, 400),
        icuBeds: h.capacity?.icu_beds || randInt(5, 30),
        verified: Math.random() > 0.3,
        latitude: h.address?.coordinates?.lat || null,
        longitude: h.address?.coordinates?.lng || null,
        imageUrl: null,
        departments: h.departments ? JSON.stringify(h.departments) : null,
        facilities: h.facilities ? JSON.stringify(h.facilities) : null,
        timings: h.timings ? JSON.stringify(h.timings) : null,
      },
    });

    // Seed bed inventory for each hospital
    const icuTypes = h.capacity?.icu_types || [];
    for (const bedType of BED_TYPES) {
      const hasType = bedType === "ICU" || bedType === "Emergency Ward" || icuTypes.some((t: string) => {
        if (bedType === "Cardiac ICU") return t.toLowerCase().includes("cardiac");
        if (bedType === "NICU") return t.toLowerCase().includes("neonatal") || t.toLowerCase().includes("nicu");
        if (bedType === "PICU") return t.toLowerCase().includes("pediatric") || t.toLowerCase().includes("picu");
        if (bedType === "Ventilator Bed") return true;
        return false;
      });

      if (!hasType && Math.random() > 0.4) continue;

      const total = bedType === "ICU" ? randInt(5, 20) : randInt(2, 10);
      const available = randInt(0, total);
      const statuses = ["live", "live", "live", "verified", "stale"];

      await prisma.bedInventory.create({
        data: {
          hospitalId: hospital.id,
          bedType,
          totalBeds: total,
          availableBeds: available,
          ventilatorAvailable: bedType === "Ventilator Bed" || Math.random() > 0.5,
          status: statuses[randInt(0, statuses.length - 1)],
          lastUpdatedAt: new Date(Date.now() - randInt(0, 15) * 60000),
        },
      });
    }
  }

  // Seed ambulance providers
  const ambulances = [
    { providerName: "RapidCare ALS 12", vehicleType: "Advanced Life Support", area: "Indiranagar", etaMinutes: 7, lat: 12.9784, lng: 77.6408 },
    { providerName: "Namma Emergency BLS 4", vehicleType: "Basic Life Support", area: "Koramangala", etaMinutes: 9, lat: 12.9352, lng: 77.6245 },
    { providerName: "LifeLine ALS Hebbal", vehicleType: "Advanced Life Support", area: "Hebbal", etaMinutes: 11, lat: 13.0358, lng: 77.5970 },
    { providerName: "Cardiac Response Unit 2", vehicleType: "Cardiac Ambulance", area: "Whitefield", etaMinutes: 14, lat: 12.9698, lng: 77.7500 },
    { providerName: "MetroMed ICU Transport", vehicleType: "Advanced Life Support", area: "MG Road", etaMinutes: 10, lat: 12.9756, lng: 77.6068 },
    { providerName: "Bengaluru Neonatal Rescue", vehicleType: "Neonatal Ambulance", area: "Jayanagar", etaMinutes: 16, lat: 12.9308, lng: 77.5838 },
    { providerName: "CriticalCare Express", vehicleType: "Advanced Life Support", area: "Electronic City", etaMinutes: 12, lat: 12.8456, lng: 77.6603 },
    { providerName: "LifeGuard O2 Unit", vehicleType: "Oxygen Support Ambulance", area: "Marathahalli", etaMinutes: 8, lat: 12.9591, lng: 77.6974 },
  ];

  for (const a of ambulances) {
    await prisma.ambulanceProvider.create({
      data: {
        providerName: a.providerName,
        vehicleType: a.vehicleType,
        area: a.area,
        city: "Bengaluru",
        etaMinutes: a.etaMinutes,
        status: Math.random() > 0.15 ? "available" : "busy",
        phone: `+91 ${randInt(70000, 99999)}${randInt(10000, 99999)}`,
        latitude: a.lat,
        longitude: a.lng,
      },
    });
  }

  // Seed demo user
  await prisma.user.create({
    data: {
      email: "demo@openicu.in",
      phone: "+91 9876543210",
      caregiverName: "Demo User",
      consentContact: true,
    },
  });

  // Seed audit events
  const auditEvents = [
    { eventType: "bed_update", actorType: "hospital", entityType: "bed_inventory", message: "ICU bed updated at Apollo Bannerghatta" },
    { eventType: "ambulance_dispatch", actorType: "system", entityType: "ambulance_request", message: "Ambulance dispatched near Indiranagar" },
    { eventType: "reservation_created", actorType: "user", entityType: "reservation", message: "Reservation request created for Cardiac ICU" },
    { eventType: "hospital_verify", actorType: "hospital", entityType: "hospital", message: "Hospital desk verified Aster CMI inventory" },
    { eventType: "payment_created", actorType: "user", entityType: "payment", message: "Payment deposit created for ICU reservation" },
    { eventType: "bed_update", actorType: "hospital", entityType: "bed_inventory", message: "Ventilator beds updated at Manipal Hospital" },
    { eventType: "ambulance_dispatch", actorType: "system", entityType: "ambulance_request", message: "Neonatal ambulance dispatched to Jayanagar" },
    { eventType: "reservation_confirmed", actorType: "hospital", entityType: "reservation", message: "Bed reservation confirmed at Narayana Health" },
  ];

  for (let i = 0; i < auditEvents.length; i++) {
    await prisma.auditEvent.create({
      data: {
        ...auditEvents[i],
        actorId: null,
        entityId: null,
        metadata: null,
        createdAt: new Date(Date.now() - (i + 1) * 2 * 60000),
      },
    });
  }

  const hospitalCount = await prisma.hospital.count();
  const bedCount = await prisma.bedInventory.count();
  const ambCount = await prisma.ambulanceProvider.count();
  console.log(`Seeded: ${hospitalCount} hospitals, ${bedCount} bed inventories, ${ambCount} ambulances, ${auditEvents.length} audit events`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
