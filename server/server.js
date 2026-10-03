require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
