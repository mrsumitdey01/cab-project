const mongoose = require('mongoose');
const RouteOption = require('../../models/RouteOption');
const CabOption = require('../../models/CabOption');

const routes = [
  { label: 'Delhi → Noida Express', etaMinutes: 45, distanceKm: 26, baseFare: 520 },
  { label: 'Delhi → Gurgaon Rapid', etaMinutes: 55, distanceKm: 32, baseFare: 610 },
  { label: 'Mumbai → Airport Shuttle', etaMinutes: 35, distanceKm: 18, baseFare: 480 },
  { label: 'Bengaluru → Whitefield', etaMinutes: 50, distanceKm: 22, baseFare: 540 },
  { label: 'Hyderabad → Gachibowli', etaMinutes: 40, distanceKm: 16, baseFare: 420 },
];

const cabs = [
  { cabType: 'Mini', carModel: 'Maruti Swift', multiplier: 1.0 },
  { cabType: 'Sedan', carModel: 'Honda City', multiplier: 1.25 },
  { cabType: 'SUV', carModel: 'Toyota Innova', multiplier: 1.6 },
  { cabType: 'Premium', carModel: 'Skoda Superb', multiplier: 1.9 },
  { cabType: 'Luxury', carModel: 'Mercedes E-Class', multiplier: 2.4 },
];

async function seed() {
  const existingRoutes = await RouteOption.countDocuments({});
  const existingCabs = await CabOption.countDocuments({});

  if (existingRoutes === 0) {
    await RouteOption.insertMany(routes);
    console.log('Seeded RouteOption');
  } else {
    console.log('RouteOption already seeded');
  }

  if (existingCabs === 0) {
    await CabOption.insertMany(cabs);
    console.log('Seeded CabOption');
  } else {
    console.log('CabOption already seeded');
  }
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
