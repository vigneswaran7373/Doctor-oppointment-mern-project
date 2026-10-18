require('dotenv').config();
const mongoose = require('mongoose');
const seedData = require('./seedData');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await seedData();
  console.log('Seeded. Logins (password: password123): admin@clinic.com, patient@clinic.com, doctor1@clinic.com ... doctor6@clinic.com');
  process.exit(0);
})().catch((e) => { console.error('Seeding failed:', e.message); process.exit(1); });
