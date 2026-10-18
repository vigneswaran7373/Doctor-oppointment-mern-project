const { Schema, model } = require('mongoose');
const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
}, { timestamps: true });
module.exports = model('User', userSchema);
