process.env.JWT_SECRET = 'test-secret';
process.env.QUIET_ERRORS = '1';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/doctor_test';
const server = app.listen(0);
const api = request(server);
const auth = (t) => ({ Authorization: `Bearer ${t}` });
let adminTok, patTok, pat2Tok, docTok, doctor;

// next Wednesday that is at least 3 days away (doctors work Mon-Sat)
const future = (() => { const d = new Date(); d.setDate(d.getDate() + 3); while (d.getDay() !== 3) d.setDate(d.getDate() + 1); return d.toLocaleDateString('en-CA'); })();

before(async () => {
  await mongoose.connect(URI);
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), require('../models/Appointment').init()]);
  const hash = await bcrypt.hash('secret123', 4);
  await User.create({ name: 'Admin', email: 'admin@t.com', password: hash, role: 'admin' });
  const du = await User.create({ name: 'Dr Test', email: 'doc@t.com', password: hash, role: 'doctor' });
  doctor = await Doctor.create({ user: du._id, name: 'Dr Test', specialization: 'Cardiologist', fees: 500, availableDays: [1, 2, 3, 4, 5, 6] });
  const login = async (email) => (await api.post('/api/auth/login').send({ email, password: 'secret123' })).body.token;
  adminTok = await login('admin@t.com');
  docTok = await login('doc@t.com');
});
after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); server.close(); });

test('register validates and creates patient', async () => {
  assert.equal((await api.post('/api/auth/register').send({ email: 'x@y.com' })).status, 400);
  assert.equal((await api.post('/api/auth/register').send({ name: 'A', email: 'a@t.com', password: '123' })).status, 400);
  const r = await api.post('/api/auth/register').send({ name: 'Pat One', email: 'pat1@t.com', password: 'secret123' });
  assert.equal(r.status, 201); assert.equal(r.body.user.role, 'patient'); patTok = r.body.token;
  assert.equal((await api.post('/api/auth/register').send({ name: 'Dup', email: 'PAT1@t.com', password: 'secret123' })).status, 409);
  pat2Tok = (await api.post('/api/auth/register').send({ name: 'Pat Two', email: 'pat2@t.com', password: 'secret123' })).body.token;
});

test('login rejects bad password and /me needs token', async () => {
  assert.equal((await api.post('/api/auth/login').send({ email: 'pat1@t.com', password: 'wrong' })).status, 401);
  assert.equal((await api.get('/api/auth/me')).status, 401);
  assert.equal((await api.get('/api/auth/me').set(auth(patTok))).body.user.email, 'pat1@t.com');
});

test('doctor search and specializations', async () => {
  assert.equal((await api.get('/api/doctors?q=cardio')).body.length, 1);
  assert.equal((await api.get('/api/doctors?q=zzz')).body.length, 0);
  assert.equal((await api.get('/api/doctors?specialization=cardiologist')).body.length, 1);
  assert.deepEqual((await api.get('/api/doctors/specializations')).body, ['Cardiologist']);
  assert.equal((await api.get('/api/doctors?q=(')).status, 200); // regex-safe
});

test('slots: generated, bad date rejected, unavailable day empty', async () => {
  const r = await api.get(`/api/doctors/${doctor._id}/slots?date=${future}`);
  assert.equal(r.body.slots.length, 16); assert.ok(r.body.slots.every((s) => s.available));
  assert.equal((await api.get(`/api/doctors/${doctor._id}/slots?date=nope`)).status, 400);
  const d = new Date(`${future}T00:00:00`); while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  assert.equal((await api.get(`/api/doctors/${doctor._id}/slots?date=${d.toLocaleDateString('en-CA')}`)).body.slots.length, 0);
});

let apptId;
test('booking: validation, success, double-booking blocked', async () => {
  const body = { doctorId: doctor._id, date: future, time: '10:00', reason: 'checkup' };
  assert.equal((await api.post('/api/appointments').send(body)).status, 401);
  assert.equal((await api.post('/api/appointments').set(auth(adminTok)).send(body)).status, 403);
  assert.equal((await api.post('/api/appointments').set(auth(patTok)).send({ ...body, time: '10:10' })).status, 400);
  assert.equal((await api.post('/api/appointments').set(auth(patTok)).send({ ...body, date: '2020-01-01' })).status, 400);
  const ok = await api.post('/api/appointments').set(auth(patTok)).send(body);
  assert.equal(ok.status, 201); apptId = ok.body._id;
  assert.equal((await api.post('/api/appointments').set(auth(pat2Tok)).send(body)).status, 409);
  const slots = (await api.get(`/api/doctors/${doctor._id}/slots?date=${future}`)).body.slots;
  assert.equal(slots.find((s) => s.time === '10:00').available, false);
});

test('concurrent bookings of one slot: exactly one wins', async () => {
  const body = { doctorId: doctor._id, date: future, time: '11:00' };
  const res = await Promise.all([patTok, pat2Tok, patTok, pat2Tok].map((t) => api.post('/api/appointments').set(auth(t)).send(body)));
  assert.equal(res.filter((r) => r.status === 201).length, 1);
  assert.equal(res.filter((r) => r.status === 409).length, 3);
});

test('patients see only their own; other patient cannot cancel', async () => {
  assert.ok((await api.get('/api/appointments/mine').set(auth(patTok))).body.every((a) => a.patient.email === 'pat1@t.com'));
  assert.equal((await api.patch(`/api/appointments/${apptId}/cancel`).set(auth(pat2Tok))).status, 403);
});

test('doctor confirms/completes; cancelled frees the slot for re-booking', async () => {
  assert.equal((await api.get('/api/appointments/doctor').set(auth(docTok))).body.length >= 1, true);
  assert.equal((await api.patch(`/api/appointments/${apptId}/status`).set(auth(patTok)).send({ status: 'confirmed' })).status, 403);
  assert.equal((await api.patch(`/api/appointments/${apptId}/status`).set(auth(docTok)).send({ status: 'bogus' })).status, 400);
  assert.equal((await api.patch(`/api/appointments/${apptId}/status`).set(auth(docTok)).send({ status: 'confirmed' })).body.status, 'confirmed');
  const c = await api.patch(`/api/appointments/${apptId}/cancel`).set(auth(patTok));
  assert.equal(c.body.status, 'cancelled');
  assert.equal((await api.patch(`/api/appointments/${apptId}/cancel`).set(auth(patTok))).status, 400);
  const again = await api.post('/api/appointments').set(auth(pat2Tok)).send({ doctorId: doctor._id, date: future, time: '10:00' });
  assert.equal(again.status, 201);
});

test('admin: add doctor with login, list all, remove doctor cancels appointments', async () => {
  assert.equal((await api.post('/api/doctors').set(auth(patTok)).send({ name: 'X', specialization: 'Y' })).status, 403);
  const add = await api.post('/api/doctors').set(auth(adminTok)).send({ name: 'Dr New', specialization: 'ENT', email: 'new@t.com', password: 'secret123' });
  assert.equal(add.status, 201);
  assert.equal((await api.post('/api/auth/login').send({ email: 'new@t.com', password: 'secret123' })).body.user.role, 'doctor');
  assert.ok((await api.get('/api/appointments').set(auth(adminTok))).body.length >= 2);
  assert.equal((await api.get('/api/appointments').set(auth(patTok))).status, 403);
  const b = await api.post('/api/appointments').set(auth(patTok)).send({ doctorId: add.body._id, date: future, time: '09:00' });
  assert.equal(b.status, 201);
  assert.equal((await api.delete(`/api/doctors/${add.body._id}`).set(auth(adminTok))).status, 200);
  const mine = (await api.get('/api/appointments/mine').set(auth(patTok))).body.find((a) => a._id === b.body._id);
  assert.equal(mine.status, 'cancelled');
});
