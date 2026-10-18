require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const User = require('./models/User');
const seedData = require('./seedData');

const prod = process.env.NODE_ENV === 'production';
if (!process.env.MONGO_URI) { console.error('MONGO_URI is not set'); process.exit(1); }
if (prod && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change_this_secret')) {
  console.error('Set a strong JWT_SECRET before running in production'); process.exit(1);
}
if (prod && !process.env.CLIENT_URL) console.warn('Warning: CLIENT_URL is not set, so any website can call this API');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Demo convenience: fill an EMPTY database on first boot (never touches existing data).
  if (process.env.SEED_ON_EMPTY === 'true' && !(await User.exists({}))) {
    await seedData();
    console.log('Empty database detected: demo admin, patient and doctors created');
  }
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`CareSlot API on port ${port}`));
}).catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
