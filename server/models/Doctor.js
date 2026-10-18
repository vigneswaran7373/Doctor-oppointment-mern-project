const { Schema, model } = require('mongoose');
const doctorSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  specialization: { type: String, required: true, trim: true },
  experience: { type: Number, default: 0 },
  fees: { type: Number, default: 0 },
  about: { type: String, default: '' },
  availableDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0=Sun ... 6=Sat
  slotStart: { type: String, default: '09:00' },
  slotEnd: { type: String, default: '17:00' },
  slotMinutes: { type: Number, default: 30 },
}, { timestamps: true });
module.exports = model('Doctor', doctorSchema);
