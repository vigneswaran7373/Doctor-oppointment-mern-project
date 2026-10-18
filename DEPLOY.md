# Deploy CareSlot (free): Vercel + Render + MongoDB Atlas

```
Browser ──► Vercel (React client) ──► Render (Express API) ──► MongoDB Atlas
```
The client goes on Vercel. The API stays on Render (a normal long-running Node server). Everything is on free plans.

Collect 3 values in a notepad as you go: **MONGO_URI**, **API URL**, **SITE URL**.

## 1. MongoDB Atlas (reuse your existing cluster)
1. Atlas → your project → **Database Access**: use your existing database user (or add one with a simple password, letters and numbers only).
2. **Network Access**: `0.0.0.0/0` must be listed and Active.
3. **Connect → Drivers** → copy the string and put the database name **`doctor_appointments`** before the `?`:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/doctor_appointments?retryWrites=true&w=majority
   ```
   ➜ **MONGO_URI**. (No `<` `>`, no quotes. A new database name is enough; no new cluster needed.)

## 2. GitHub
Create an empty repository, e.g. `CareSlot-doctor-appointment-mern` (no README). In this folder (the one containing `render.yaml`, `client/` and `server/`):
```bash
git init
git add .
git status          # check: no node_modules, no .env
git commit -m "CareSlot: doctor appointment booking (MERN)"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/CareSlot-doctor-appointment-mern.git
git push -u origin main
```
To overwrite an old repo completely, use `git push -u origin main --force`.

## 3. Render (API)
1. render.com → **New + → Blueprint** → pick the repo → Blueprint name: `careslot`.
2. Render reads `render.yaml` and asks for:
   - **MONGO_URI**: paste the Atlas string from step 1
   - **CLIENT_URL**: type `http://localhost:5173` for now (fixed in step 5)
3. **Apply / Deploy Blueprint**. Wait 3-5 minutes until **Live**.
4. Copy the service URL, e.g. `https://careslot-api-xxxx.onrender.com` ➜ **API URL**.
5. Open `API URL/api/health` → you must see `{"ok":true}`.

On first start the empty database is filled with the demo admin, patient and 6 doctors (`SEED_ON_EMPTY`). `JWT_SECRET` is generated for you, and `TZ=Asia/Kolkata` makes appointment slots and the "time already passed" checks use Indian time instead of UTC.

## 4. Vercel (client)
1. vercel.com → **Add New → Project** → import the repo.
2. **Root Directory** → Edit → **`client`**.
3. Framework shows **Vite** (leave as is).
4. **Environment Variables**: `VITE_API_URL` = `API URL` + `/api`, e.g. `https://careslot-api-xxxx.onrender.com/api` (**must end with /api**, no trailing `/`).
5. **Deploy**. Copy the site URL, e.g. `https://careslot-xxxx.vercel.app` ➜ **SITE URL**.

## 5. Connect them (CORS)
Render → `careslot-api` → **Environment** → edit **CLIENT_URL** → the **SITE URL** (https, **no trailing `/`**) → Save. Render redeploys (1-2 min).

## 6. Test
1. Open the SITE URL. You land on the **Log in** page (visitors cannot see any other page before logging in).
2. Click **Patient** (demo button) → **Log in** → the doctors page appears.
3. Open a doctor → pick a date → pick a time → **Confirm booking**. It shows under *My appointments*.
4. Log out → **Doctor** demo → **Log in** → *My schedule* → **Confirm** the appointment.
5. Log out → **Admin** demo to see all appointments and add a doctor.

Demo logins (password `password123`): patient@clinic.com, doctor1@clinic.com … doctor6@clinic.com, admin@clinic.com.

## Good to know
- **First request is slow (30-60 s)**: Render's free server sleeps after 15 min idle. Create a free monitor at uptimerobot.com for `API URL/api/health` every 5 minutes to keep it awake.
- **Changed VITE_API_URL?** Vercel → Deployments → Redeploy (it is baked in at build time).
- **Want a private app (no public demo logins)?** In Render set `SEED_ON_EMPTY` to `false`, seed once from your PC with your Atlas string in `server/.env` and `npm run seed`, then change the passwords.

## Troubleshooting
| Symptom | Fix |
|---|---|
| "Failed to fetch" or CORS error on the login page | CLIENT_URL on Render must equal the Vercel URL exactly (https, no trailing `/`). |
| Login page loads but login does nothing / network tab shows `localhost` | VITE_API_URL missing on Vercel. Add it, then Redeploy. |
| Refreshing a page gives 404 | `client/vercel.json` missing from the repo. |
| Render log `MongoDB connection failed` + `bad auth` | Wrong database user or password in MONGO_URI (the *database user* password, not your Atlas login). |
| Render log `MongoDB connection failed` + timeout / SSL alert | Atlas Network Access must list `0.0.0.0/0` and be Active. |
| Login says invalid email or password | Database was not seeded: SEED_ON_EMPTY must be `true` and the `doctor_appointments` database empty, then restart the service. |
| Today's early slots show as free although the time passed | `TZ=Asia/Kolkata` is missing on Render (it is in `render.yaml`; add it manually if you did not use the Blueprint). |

## Run locally on an external / E: drive
If `npm run dev` in `client/` crashes with `UNKNOWN: stat ...`, run it with polling: `VITE_POLL=1 npm run dev` (Windows CMD: `set VITE_POLL=1 && npm run dev`). If `npm install` itself fails there, copy the project to C: and install there.
