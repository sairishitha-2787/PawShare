# Deploying PawShare

Notes for whoever deploys (Vedha). Nothing here has been deployed yet.

PawShare is two apps in one repo:

| Part | Folder | Where it goes | Build | Start |
|---|---|---|---|---|
| Frontend (React + Vite) | `client/` | Vercel | `npm run build` → `dist/` | static files |
| API (Express) | `server/` | any Node host (Render, Railway, …) | `npm install` | `npm start` |
| Database | – | MongoDB Atlas (the team cluster, database `pawshare`) | – | – |

## Order of steps

The two apps need each other's URLs, so do them in this order:

1. **Deploy the API** with the server variables below. Leave `CLIENT_URL` empty for now and note the API's URL,
   e.g. `https://pawshare-api.onrender.com`.
2. **Deploy the client** on Vercel with `VITE_API_URL=https://pawshare-api.onrender.com/api`. Note its URL,
   e.g. `https://pawshare.vercel.app`.
3. **Set `CLIENT_URL`** on the API to that Vercel URL and restart the API.
4. **Re-run the demo seed with `CLIENT_URL` set to the Vercel URL** (see "Demo data" below). Until you do,
   the demo pets' photos point at `localhost` and show as broken on the live site.
5. Create the admin account (`npm run create-admin`, below).
6. Run through the checks at the end.

## Frontend on Vercel

- **Root directory:** `client`. Vercel detects Vite: build command `npm run build`, output directory `dist`.
- **`client/vercel.json`** rewrites every path to `index.html`, so links like `/adopt/<id>` or
  `/messages/<id>` work on a refresh or when opened directly. Real files (`/assets/…`, `/demo-pets/…`)
  are still served as files, because Vercel checks the file system before applying rewrites.

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Value |
|---|---|---|
| `VITE_API_URL` | **yes** | The API's URL **including `/api`**, e.g. `https://pawshare-api.onrender.com/api`. A trailing slash is fine. |
| `VITE_CLOUDINARY_CLOUD_NAME` | no | Cloudinary cloud name, for photo and document uploads. |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | no | An **unsigned** upload preset in that cloud. Without both Cloudinary variables, the forms ask for an image link instead. |
| `VITE_USE_MOCK` | no | Leave unset or `false` in production. `true` shows the built-in sample pets without an API (backup for demos only). |

- `VITE_` variables are **baked in when the site is built**, not read at runtime. After changing one,
  **redeploy** (Deployments → … → Redeploy); saving the variable alone changes nothing.
- A production build **without `VITE_API_URL`** doesn't fall back to localhost. Every page shows an ERROR
  window, **"API URL NOT CONFIGURED."**. If you see it, set the variable and redeploy.
- These values are public: anyone can read them in the browser. Never put a secret in a `VITE_` variable.
- `/dev/kit` (the component gallery) only exists in `npm run dev`; in production it's a 404.

## API

### Environment variables

| Variable | Required | Value |
|---|---|---|
| `MONGODB_URI` | **yes** | The Atlas connection string **with the database name**: `mongodb+srv://…/pawshare?retryWrites=true&w=majority`. Without `/pawshare` it writes to a database called `test`. |
| `JWT_SECRET` | **yes** | A long random string, different from anyone's local one. The server won't start without it. Changing it logs everyone out. |
| `CLIENT_URL` | **yes** | The frontend's exact origin, e.g. `https://pawshare.vercel.app`: `https`, no path, **no trailing slash**. See below. |
| `NODE_ENV` | recommended | `production`. With it, a 500 error no longer sends the internal error message to the browser. |
| `PORT` | no | Most hosts set it themselves; the server uses it, or 5000. |

### `CLIENT_URL` does two jobs

1. **It's the CORS origin.** `server/app.js` runs `cors({ origin: process.env.CLIENT_URL || "*" })`:
   - Set, the API only answers browser requests from that one origin. It has to match the address bar
     exactly (`https://pawshare.vercel.app`, not `…vercel.app/`, not `http://…`). A mismatch shows in the
     browser console as a CORS error, and the site shows "Couldn't reach the server".
   - **Unset, any website can call the API.** Don't leave it empty in production.
   - It's one origin only. Vercel **preview** deployments (`pawshare-git-branch-….vercel.app`) and a custom
     domain are different origins, so they're blocked unless `CLIENT_URL` is changed to them. Use the
     production URL for the demo.
2. **It's where the demo photos come from.** `npm run seed:demo` saves each demo pet's photo as
   `${CLIENT_URL}/demo-pets/<name>.jpg`, a full URL in the database. The images live in `client/public/demo-pets/`
   and are served by the frontend.

### Demo data (after the first deploy, and whenever `CLIENT_URL` changes)

From `server/` on your machine, pointing at the production database. Your IP has to be on the Atlas access
list; a TLS error on connect usually means it isn't.

```sh
# macOS / Linux / Git Bash
MONGODB_URI="mongodb+srv://…/pawshare?…" CLIENT_URL="https://pawshare.vercel.app" npm run seed:demo

# PowerShell
$env:MONGODB_URI="mongodb+srv://…/pawshare?…"; $env:CLIENT_URL="https://pawshare.vercel.app"; npm run seed:demo
```

Variables set on the command line win over `server/.env`, because dotenv doesn't overwrite variables that are
already set. **Re-run `npm run seed:demo` with `CLIENT_URL` set to the Vercel URL after deploying.** It updates the
demo pets in place (same ids), so their photo URLs then point at the live site.

`npm run seed:demo -- --reset` puts the demo back as it was seeded before a presentation (see `docs/DEMO.md`).
It refuses to run when `NODE_ENV=production` is set in that shell, or when `MONGODB_URI` doesn't mention `pawshare`.

### Admin account

The seed makes no admin. Create one against the production database:

```sh
npm run create-admin -- admin@demo.pawshare.test "PawShare@123" "Asha Admin"
```

Use a stronger password if the site stays up after the review.

## Checks after deploying

- [ ] Open the Vercel URL: the desktop loads and PET_OF_THE_DAY.JPG shows a **photo**, not a broken image.
- [ ] `/adopt` shows 9 pets on the map; refresh on `/adopt/<some id>` still opens that profile (SPA rewrite).
- [ ] Log in as `adopter@demo.pawshare.test` / `PawShare@123`; the taskbar shows "Ananya · adopter".
- [ ] DevTools console: no CORS errors. Network: API calls go to the API host, not `localhost`.
- [ ] `/dev/kit` shows FILE NOT FOUND.
- [ ] Log in as the admin: `/admin` opens CONTROL_PANEL.EXE.
