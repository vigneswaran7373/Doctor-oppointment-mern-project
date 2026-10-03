# CareSlot – Doctor Appointment Booking System (MERN)

Patients search doctors, see live free slots, book/cancel appointments. Doctors confirm/complete them. Admins manage doctors and see everything.

**Stack:** MongoDB · Express.js · React (Vite) · Node.js · JWT auth · REST APIs

## Features
- Register / login with JWT, role-based access (patient, doctor, admin)
- Search doctors by name or specialty, filter by specialization
- Live slot grid per date (generated from the doctor's working days/hours; taken & past slots disabled)
- Double-booking is impossible: every appointment holds a unique `slotKey` (`doctor|date|time`) enforced by a MongoDB unique index (released on cancel), with a friendly 409 message
- Patient: book, view, cancel appointments
- Doctor: schedule view, confirm / complete / cancel
- Admin: add or remove doctors (creates their login), view all appointments

## Run it
Requires Node 18+ and MongoDB running locally (or an Atlas URI).

```bash
# 1. API
cd server
cp .env.example .env        # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed                # demo doctors + users
npm run dev                 # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Demo logins (password `password123`): `patient@clinic.com`, `doctor1@clinic.com` … `doctor6@clinic.com`, `admin@clinic.com`.

## Tests
```bash
cd server && npm test      # 9 API tests (needs MongoDB; uses a separate `doctor_test` database that it wipes)
```
Covers auth, search, slot generation, validation, role permissions, cancel/re-book, and 4 patients racing for one slot (exactly one wins).

## REST API
| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET | /api/auth/me | logged in |
| GET | /api/doctors?q=&specialization= | public |
| GET | /api/doctors/:id, /api/doctors/:id/slots?date=YYYY-MM-DD | public |
| POST / DELETE | /api/doctors, /api/doctors/:id | admin |
| POST | /api/appointments | patient |
| GET | /api/appointments/mine · /doctor · / | patient · doctor · admin |
| PATCH | /api/appointments/:id/cancel | owner, doctor, admin |
| PATCH | /api/appointments/:id/status | doctor, admin |

## Deploy notes
Set `VITE_API_URL` (client build) to your API URL, `CLIENT_URL` and a strong `JWT_SECRET` on the server.
