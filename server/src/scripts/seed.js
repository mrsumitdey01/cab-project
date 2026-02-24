const mongoose = require('mongoose');
const RouteOption = require('../../models/RouteOption');
const CabOption = require('../../models/CabOption');

async function seed() {
  const routesCount = await RouteOption.countDocuments({});
  const cabsCount = await CabOption.countDocuments({});

  if (routesCount > 0 || cabsCount > 0) {
    console.log('Seed skipped: data already exists.');
    return;
  }

  await RouteOption.insertMany([
    { label: 'Fastest Route', etaMinutes: 18, distanceKm: 12, baseFare: 220 },
    { label: 'City Saver', etaMinutes: 25, distanceKm: 15, baseFare: 180 },
    { label: 'Scenic Drive', etaMinutes: 30, distanceKm: 18, baseFare: 260 },
  ]);

  await CabOption.insertMany([
    { cabType: 'Mini', carModel: 'Suzuki Swift', multiplier: 1.0 },
    { cabType: 'Sedan', carModel: 'Honda City', multiplier: 1.3 },
    { cabType: 'SUV', carModel: 'Toyota Innova', multiplier: 1.6 },
    { cabType: 'Luxury', carModel: 'Mercedes E-Class', multiplier: 2.2 },
    { cabType: 'Van', carModel: 'Kia Carnival', multiplier: 1.8 },
  ]);

  console.log('Seed completed.');
}

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is required');
  await mongoose.connect(uri);
  await seed();
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
