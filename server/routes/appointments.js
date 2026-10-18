const router = require('express').Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { protect, allow } = require('../middleware/auth');

const populate = (q) => q.populate('doctor', 'name specialization fees').populate('patient', 'name email phone');
const m = (t) => { const [h, mm] = t.split(':').map(Number); return h * 60 + mm; };

// Patient: book
router.post('/', protect, allow('patient'), async (req, res, next) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    if (!doctorId || !date || !time) return res.status(400).json({ message: 'doctorId, date and time are required' });
    const doc = await Doctor.findById(doctorId);
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });

    const when = new Date(`${date}T${time}:00`);
    if (isNaN(when) || when <= new Date()) return res.status(400).json({ message: 'Choose a future date and time' });
    if (!doc.availableDays.includes(when.getDay())) return res.status(400).json({ message: 'Doctor is not available that day' });
    const t = m(time);
    const valid = t >= m(doc.slotStart) && t + doc.slotMinutes <= m(doc.slotEnd) && (t - m(doc.slotStart)) % doc.slotMinutes === 0;
    if (!valid) return res.status(400).json({ message: 'Invalid time slot' });

    try {
      const appt = await Appointment.create({ patient: req.user._id, doctor: doc._id, date, time, reason, slotKey: `${doc._id}|${date}|${time}` });
      res.status(201).json(await populate(Appointment.findById(appt._id)));
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ message: 'That slot was just booked. Pick another.' });
      throw e;
    }
  } catch (e) { next(e); }
});

// Patient: my appointments
router.get('/mine', protect, allow('patient'), async (req, res, next) => {
  try { res.json(await populate(Appointment.find({ patient: req.user._id }).sort({ date: -1, time: -1 }))); }
  catch (e) { next(e); }
});

// Doctor: appointments for my profile
router.get('/doctor', protect, allow('doctor'), async (req, res, next) => {
  try {
    const doc = await Doctor.findOne({ user: req.user._id });
    if (!doc) return res.json([]);
    res.json(await populate(Appointment.find({ doctor: doc._id }).sort({ date: 1, time: 1 })));
  } catch (e) { next(e); }
});

// Admin: everything
router.get('/', protect, allow('admin'), async (_req, res, next) => {
  try { res.json(await populate(Appointment.find().sort({ date: -1, time: -1 }).limit(300))); }
  catch (e) { next(e); }
});

async function canTouch(user, appt) {
  if (user.role === 'admin') return true;
  if (user.role === 'patient') return String(appt.patient) === String(user._id);
  const doc = await Doctor.findOne({ user: user._id });
  return doc && String(appt.doctor) === String(doc._id);
}

router.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (!(await canTouch(req.user, appt))) return res.status(403).json({ message: 'Not allowed' });
    if (['completed', 'cancelled'].includes(appt.status)) return res.status(400).json({ message: `Already ${appt.status}` });
    appt.status = 'cancelled'; appt.active = false; appt.slotKey = `x|${appt._id}`;
    await appt.save();
    res.json(await populate(Appointment.findById(appt._id)));
  } catch (e) { next(e); }
});

router.patch('/:id/status', protect, allow('doctor', 'admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'completed'].includes(status)) return res.status(400).json({ message: 'Status must be confirmed or completed' });
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (!(await canTouch(req.user, appt))) return res.status(403).json({ message: 'Not allowed' });
    if (appt.status === 'cancelled') return res.status(400).json({ message: 'Appointment is cancelled' });
    appt.status = status;
    await appt.save();
    res.json(await populate(Appointment.findById(appt._id)));
  } catch (e) { next(e); }
});

module.exports = router;
