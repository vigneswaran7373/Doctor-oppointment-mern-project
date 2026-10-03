const router = require('express').Router();
const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { protect, allow } = require('../middleware/auth');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toHHMM = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

// Public: list + search (?q=cardio&specialization=Cardiologist)
router.get('/', async (req, res, next) => {
  try {
    const { q, specialization } = req.query;
    const filter = {};
    if (specialization) filter.specialization = new RegExp(`^${esc(specialization)}$`, 'i');
    if (q) {
      const rx = new RegExp(esc(q), 'i');
      filter.$or = [{ name: rx }, { specialization: rx }];
    }
    res.json(await Doctor.find(filter).sort({ name: 1 }));
  } catch (e) { next(e); }
});

router.get('/specializations', async (_req, res, next) => {
  try { res.json(await Doctor.distinct('specialization')); } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Doctor.findById(req.params.id);
    doc ? res.json(doc) : res.status(404).json({ message: 'Doctor not found' });
  } catch (e) { next(e); }
});

// Public: free/booked slots for a date (?date=YYYY-MM-DD)
router.get('/:id/slots', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ message: 'date=YYYY-MM-DD required' });
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });

    const day = new Date(`${date}T00:00:00`).getDay();
    if (!doc.availableDays.includes(day)) return res.json({ date, slots: [] });

    const taken = new Set((await Appointment.find({ doctor: doc._id, date, active: true })).map((a) => a.time));
    const now = new Date();
    const isToday = date === now.toLocaleDateString('en-CA');
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const slots = [];
    for (let t = toMin(doc.slotStart); t + doc.slotMinutes <= toMin(doc.slotEnd); t += doc.slotMinutes) {
      const time = toHHMM(t);
      slots.push({ time, available: !taken.has(time) && !(isToday && t <= nowMin) });
    }
    res.json({ date, slots });
  } catch (e) { next(e); }
});

// Admin: add doctor (also creates the doctor's login)
router.post('/', protect, allow('admin'), async (req, res, next) => {
  try {
    const { email, password, ...profile } = req.body;
    if (!profile.name || !profile.specialization) return res.status(400).json({ message: 'Name and specialization required' });
    let user;
    if (email && password) {
      user = await User.create({ name: profile.name, email, password: await bcrypt.hash(password, 10), role: 'doctor' });
    }
    res.status(201).json(await Doctor.create({ ...profile, user: user?._id }));
  } catch (e) { next(e); }
});

router.delete('/:id', protect, allow('admin'), async (req, res, next) => {
  try {
    const doc = await Doctor.findByIdAndDelete(req.params.id);
    if (doc?.user) await User.findByIdAndDelete(doc.user);
    for (const a of await Appointment.find({ doctor: req.params.id, active: true })) {
      a.status = 'cancelled'; a.active = false; a.slotKey = `x|${a._id}`;
      await a.save();
    }
    res.json({ message: 'Doctor removed' });
  } catch (e) { next(e); }
});

module.exports = router;
