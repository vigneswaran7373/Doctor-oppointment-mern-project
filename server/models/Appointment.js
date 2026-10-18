const { Schema, model } = require('mongoose');
const appointmentSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:mm
  reason: { type: String, default: '' },
  status: { type: String, enum: ['booked', 'confirmed', 'completed', 'cancelled'], default: 'booked' },
  active: { type: Boolean, default: true }, // false once cancelled
  // doctor|date|time while active; unique per-appointment value once cancelled (frees the slot)
  slotKey: { type: String, required: true, unique: true },
}, { timestamps: true });
module.exports = model('Appointment', appointmentSchema);
