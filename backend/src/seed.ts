import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clear existing
  await prisma.bedReservation.deleteMany();
  await prisma.bedInventory.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.ambulanceProvider.deleteMany();
  await prisma.user.deleteMany();

  // Read hospitals from JSON
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../../hospitals.json'), 'utf-8'));
  
  for (const h of data.hospitals) {
    const hospital = await prisma.hospital.create({
      data: {
        name: h.name,
        area: h.address.area,
        fullAddress: h.address.full,
        contactPhone: h.contact.phone?.[0] || h.contact.emergency?.[0] || null,
        latitude: h.address.coordinates?.lat || null,
        longitude: h.address.coordinates?.lng || null,
        rating: Number((4.0 + Math.random() * 1.0).toFixed(1)),
        verified: true,
      }
    });

    // Mock bed inventory
    const icuBeds = h.capacity.icu_beds || Math.floor(Math.random() * 20) + 5;
    const totalBeds = h.capacity.total_beds || Math.floor(Math.random() * 100) + 50;

    await prisma.bedInventory.create({
      data: {
        hospitalId: hospital.id,
        bedType: 'ICU',
        totalBeds: icuBeds,
        availableBeds: Math.floor(Math.random() * icuBeds),
      }
    });
    
    await prisma.bedInventory.create({
      data: {
        hospitalId: hospital.id,
        bedType: 'General',
        totalBeds: totalBeds,
        availableBeds: Math.floor(Math.random() * totalBeds),
      }
    });
  }

  // Add some mock ambulances
  const ambulances = [
    { providerName: 'RapidCare ALS 12', vehicleType: 'Advanced Life Support', etaMinutes: 7, latitude: 12.9716, longitude: 77.5946 },
    { providerName: 'Namma Emergency BLS 4', vehicleType: 'Basic Life Support', etaMinutes: 9, latitude: 12.9250, longitude: 77.5930 },
    { providerName: 'LifeLine ALS', vehicleType: 'Cardiac Ambulance', etaMinutes: 11, latitude: 13.0353, longitude: 77.5900 },
    { providerName: 'Cardiac Response Unit 2', vehicleType: 'Cardiac Ambulance', etaMinutes: 14, latitude: 12.9592, longitude: 77.6474 },
  ];

  for (const a of ambulances) {
    await prisma.ambulanceProvider.create({ data: a });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
