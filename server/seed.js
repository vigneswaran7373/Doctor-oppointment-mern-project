require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');

const doctors = [
  ['Dr. Ananya Raman', 'Cardiologist', 14, 800, 'Heart health, hypertension and preventive cardiology.'],
  ['Dr. Karthik Subramanian', 'Dermatologist', 9, 600, 'Skin, hair and nail conditions; acne and allergy care.'],
  ['Dr. Meera Nair', 'Pediatrician', 11, 500, 'Child health, vaccinations and growth monitoring.'],
  ['Dr. Rahul Verma', 'Orthopedic', 16, 900, 'Joint pain, fractures and sports injuries.'],
  ['Dr. Priya Lakshmi', 'General Physician', 7, 300, 'Fever, infections, diabetes and everyday health concerns.'],
  ['Dr. Arjun Menon', 'Neurologist', 13, 1000, 'Headache, epilepsy and nerve disorders.'],
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany({}), Doctor.deleteMany({}), Appointment.deleteMany({})]);
  const hash = await bcrypt.hash('password123', 10);

  await User.create({ name: 'Admin', email: 'admin@clinic.com', password: hash, role: 'admin' });
  await User.create({ name: 'Demo Patient', email: 'patient@clinic.com', password: hash, role: 'patient', phone: '9000000000' });

  for (const [i, [name, specialization, experience, fees, about]] of doctors.entries()) {
    const user = await User.create({ name, email: `doctor${i + 1}@clinic.com`, password: hash, role: 'doctor' });
    await Doctor.create({ user: user._id, name, specialization, experience, fees, about, availableDays: [1, 2, 3, 4, 5, 6] });
  }
  console.log('Seeded. Logins (password: password123): admin@clinic.com, patient@clinic.com, doctor1@clinic.com ... doctor6@clinic.com');
  process.exit(0);
})();
