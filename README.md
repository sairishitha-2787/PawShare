# PawShare

Pet adoption and community foster care platform. Shelters and caregivers list animals, adopters search and apply, and adoptions are tracked through approval, messaging and post-adoption check-ins.

**Team:** Sai Rishitha (24WU0101123) · Poojitha Arigela (24WU0101144) · Vedha Sri (24WU0104032)

**Stack:** MongoDB · Express 5 · React 18 + Vite · Node.js. The API is in `server/`, the web app in `client/` (see [Frontend](#frontend)).

![The neighborhood map](docs/screenshots/neighborhood-map.png)

---

## Getting started

Requirements: Node.js 20+ and a MongoDB database (a free MongoDB Atlas cluster works).

```bash
cd server
npm install
# create server/.env with the variables below
npm run create-admin -- admin@pawshare.com "change-me-123" "Admin"
npm run dev                 # http://localhost:5000/api/health → {"status":"ok"}
```

### Environment variables (`server/.env`)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `MONGODB_URI` | yes | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/pawshare` | Database connection. Without it nothing works: the server can't connect. |
| `JWT_SECRET` | yes | any long random string | Signs login tokens. The server refuses to start without it. |
| `NODE_ENV` | no | `production` | In production, a 500 error stops sending the internal error message to the browser. Unset, error details leak. |
| `CLIENT_URL` | no | `http://localhost:5173` | Allowed CORS origin (the React app) and the base URL of the demo photos in `npm run seed:demo`. Unset, any origin may call the API and demo photos point at localhost. |
| `PORT` | no | `5000` | API port. Unset, it uses 5000. |
| `CLOUDINARY_CLOUD_NAME` | no | `pawshare` | Server-side photo upload (`POST /api/upload`). Without the three Cloudinary variables that endpoint returns 500. The React app uploads straight to Cloudinary with its own `VITE_` variables, so its forms still work. |
| `CLOUDINARY_API_KEY` | no | from the Cloudinary dashboard | See `CLOUDINARY_CLOUD_NAME`. |
| `CLOUDINARY_API_SECRET` | no | from the Cloudinary dashboard | See `CLOUDINARY_CLOUD_NAME`. Secret: never put it in a `VITE_` variable. |
| `EMAIL_USER` | no | `pawshare.demo@gmail.com` | The Gmail account that sends check-in reminder emails (`server/runReminders.js`). Without it, every reminder fails to send. |
| `EMAIL_PASS` | no | a Gmail app password | The app password for `EMAIL_USER` (not the normal login password). Without it, reminders fail to send. |
| `GEOCODING_API_KEY` | no | an OpenCage API key | Turns an address into coordinates (`GET /api/geocode?address=…`). Without it that endpoint returns 500. |

### Scripts (run inside `server/`)

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-restart (nodemon) |
| `npm start` | Start for production |
| `npm test` | Run the test suite on an in-memory MongoDB — no Atlas needed |
| `npm run create-admin -- <email> <password> ["Name"]` | Create an admin, or promote an existing user. Admins can't sign up through the API. |
| `npm run seed:demo` | Add the demo shelters, pets and adopter below. Safe to re-run: updates them in place. |
| `npm run seed:demo -- --reset` | Before a demo: delete what the demo accounts created since (applications, messages, reviews, check-ins), put the demo back as seeded, then seed. Refuses to run with `NODE_ENV=production` or a `MONGODB_URI` without "pawshare". See [docs/DEMO.md](docs/DEMO.md). |

### Demo accounts

Created by `npm run seed:demo`. Every account uses the password `PawShare@123`. The first four shelters are verified and have a short public about text; the last two are waiting on an admin.

| Email | Role | What's there |
|---|---|---|
| `shelter.koramangala@demo.pawshare.test` | shelter | Happy Tails Shelter: Biscuit, Clover, Tofu |
| `shelter.indiranagar@demo.pawshare.test` | shelter | Whisker Walk Rescue: Mochi, Luna, Sushi |
| `shelter.hsr@demo.pawshare.test` | shelter | Stray Hearts Trust: Pepper, Rocky, Peanut, and Bruno (adopted) |
| `shelter.bengaluru@demo.pawshare.test` | shelter | Bengaluru Paws Collective (no pets yet) |
| `shelter.jpnagar@demo.pawshare.test` | shelter | Paws & Whiskers Foundation, JP Nagar. Verification **pending** (registration KA-BLR-TR-2024-0417), so it can't list pets until an admin approves it. |
| `shelter.whitefield@demo.pawshare.test` | shelter | Little Paws Home, Whitefield. Verification **not submitted** yet. |
| `adopter@demo.pawshare.test` | adopter | Ananya Rao. Adopted Bruno from Stray Hearts Trust 35 days before the first seed: 1-week check-in done, 1-month overdue, 3-month still to come. Left Stray Hearts a 5-star review for Bruno. |
| admin | admin | Not seeded: create your own with `npm run create-admin`. |

The seed only sets the two unverified shelters' verification when it first creates them, so approving, rejecting or resubmitting survives a re-run (`--reset` puts them back to pending / not submitted).

The 7-minute demo script for the review, with every login, is in [docs/DEMO.md](docs/DEMO.md). Deployment notes are in [docs/DEPLOY.md](docs/DEPLOY.md).

---

## Frontend

The React app in `client/`: a retro "PawShare OS" desktop where every block is a window and the pets live in houses on a
neighborhood map. The approved design is `design/neighborhood-reference.html`; `CLAUDE.md` has the design rules and routes.

| Desktop home | Neighborhood map |
|---|---|
| ![Desktop home](docs/screenshots/desktop-home.png) | ![Neighborhood map](docs/screenshots/neighborhood-map.png) |
| **Pet profile** | **Messenger** |
| ![Pet profile](docs/screenshots/pet-profile.png) | ![Messenger](docs/screenshots/messenger.png) |

### Setup

Start the API first (see [Getting started](#getting-started)), then:

```bash
cd client
npm install
cp .env.example .env.local   # optional: the defaults work with the API on :5000
npm run dev                  # http://localhost:5173
```

The API's `CLIENT_URL` must match the address the app runs on (`http://localhost:5173`), or the browser blocks its requests (CORS).
Log in with any account from [Demo accounts](#demo-accounts).

### Environment variables (`client/.env.local`)

Vite only exposes variables that start with `VITE_`, and they're fixed when the app is built, so restart `npm run dev` after a change.
They end up in the browser: never put a secret in one.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_URL` | in production | `http://localhost:5000/api` (dev only) | The API's base URL, including `/api`. A production build without it shows "API URL NOT CONFIGURED." |
| `VITE_USE_MOCK` | no | `false` | `true` shows the built-in sample pets without an API (a backup for demos). |
| `VITE_CLOUDINARY_CLOUD_NAME` | no | – | Cloudinary cloud for photo and document uploads. |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | no | – | An unsigned upload preset. Without both Cloudinary variables, forms take a pasted image link instead. |

### Scripts (run inside `client/`)

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload on :5173. Also serves `/dev/kit`, a gallery of the UI components. |
| `npm run build` | Production build into `client/dist/`. Pages other than the desktop and the map are split out and loaded when first opened. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Oxlint. |
| `npm test` | Vitest unit tests for the pure helpers: API → pet mapping, date labels, search filters and matching, check-in due states. |

Deploying (Vercel for the client, `client/vercel.json` for SPA routes): see [docs/DEPLOY.md](docs/DEPLOY.md).

### Folder structure

```
client/
├── index.html            # loads the Silkscreen + Fredoka fonts
├── vercel.json           # SPA rewrites for Vercel
├── public/demo-pets/     # the demo pets' photos (the seed points at them)
└── src/
    ├── main.jsx          # routes; every page sits in ShellLayout (page + the one taskbar)
    ├── api/              # fetch wrapper (client.js: base URL, token, 401 handling) + one file per API area
    ├── components/
    │   ├── ui/           # Window, Button, Chip, Pill, Modal, ErrorDialog, LoadingWindow, Taskbar, fields
    │   ├── shell/        # ShellLayout, StartMenu
    │   ├── map/          # Neighborhood (the street), SceneBackdrop, Legend
    │   ├── pets/         # PetFace, House, Pin, ProfileWindow, FavoritesPanel
    │   └── …             # apply, inbox, shelter, messages, checkins, shelters, search, admin, desktop, auth
    ├── context/          # Auth, Favorites, Unread, CheckIns, Admin, TaskCounts
    ├── hooks/            # data loading and polling (useAnimalSearch, useNearMe, usePolling, …)
    ├── pages/            # one per route (DesktopPage, AdoptPage, ApplyPage, MessagesPage, AdminPage, …)
    ├── utils/            # pure helpers per area (search, geo, dates, checkins, …) + their *.test.js
    ├── data/mockPets.js  # sample pets for VITE_USE_MOCK
    └── styles/           # tokens.css (colours, fonts) and global.css
```

Plain CSS with variables, one `.css` file per component, all shapes hand-drawn in SVG: no UI or icon libraries.

**Accessibility:** a "Skip to content" link, a visible focus ring on everything, keyboard-only use (houses, Start menu, dialogs
that trap Tab and close on Escape), labelled inputs and icon buttons, and no animations under `prefers-reduced-motion`.
One known exception, kept on purpose to match the reference design: the pink "SHARE" in the PAWSHARE OS logo has a
2.8:1 contrast with the background, below the 4.5:1 AA ratio. It's the only text that doesn't pass.

## Project structure

```
server/
├── server.js              # loads .env, connects to MongoDB, starts the app
├── app.js                 # Express app: middleware + routes (imported by tests)
├── config/db.js           # MongoDB connection
├── models/                # Mongoose schemas
├── controllers/           # request handlers, one file per feature
├── routes/                # URL → controller mapping and access rules
├── middleware/            # auth (protect/authorize/requireVerified), error handling, input guard
├── services/              # logic used outside HTTP: check-in reminders, admin creation
├── scripts/createAdmin.js # CLI for the first admin
├── utils/                 # small shared helpers
└── tests/                 # node:test + supertest, one file per feature
docs/
└── PawShare.postman_collection.json
```

---

## How it works

### Roles

| Role | Can |
|---|---|
| **Adopter** | Search animals, apply to adopt/foster, message shelters, complete check-ins, review shelters |
| **Shelter** (shelters and individual caregivers) | Request verification; once verified, list animals, decide applications, message adopters, see check-ins |
| **Admin** | Verify/revoke shelters, moderate reviews, edit any listing |

### Adoption flow

```
Shelter signs up ─► requests verification ─► admin approves ─► shelter lists animal (status: available)
                                                                        │
Adopter applies ─────────────────────────────────────────────► animal: pending
                                                                        │
Shelter approves one application ─► animal: adopted / fostered
                                  ─► other pending applicants are rejected automatically
                                  ─► check-ins scheduled at 1 week, 1 month, 3 months
                                                                        │
Adopter completes check-ins with health updates, can review the shelter
```

If every application for an animal is rejected or withdrawn, it goes back to `available`.

### Data model

| Collection | Key fields | Relations |
|---|---|---|
| **User** | name, email, password (bcrypt hash, never returned), role, location (city/state + GeoJSON point), isVerified, verification, rating, ratingCount | — |
| **Animal** | name, species, breed, ageMonths → ageGroup, gender, size, photos, healthRecords, vaccinated, neutered, temperament tags, listingType, status, location | owner → User |
| **Application** | type (adoption/foster), status, lifestyle answers, message, fosterUntil, shelterNote, decidedAt | animal → Animal, applicant → User, shelter → User |
| **Thread** | participants (2), lastMessage, key (one thread per pair per animal) | participants → User, animal → Animal |
| **Message** | text, readAt | thread → Thread, sender → User |
| **CheckIn** | kind (scheduled/adhoc), label, dueDate, status, healthUpdate, remindedAt | application, animal, adopter, shelter |
| **Review** | rating (1–5), comment | shelter → User, reviewer → User, application (unique) |

Geo search uses `2dsphere` indexes on `location.coordinates`. Coordinates are GeoJSON order: **`[longitude, latitude]`**.

---

## API reference

Base URL: `http://localhost:5000/api`. The Postman collection in [`docs/`](docs/PawShare.postman_collection.json) has a ready-to-run example for every endpoint.

**Auth:** protected routes need `Authorization: Bearer <token>`. Tokens come from signup/login and last 7 days.

**Errors** are always JSON:
```json
{ "message": "Validation failed", "errors": ["Path `ageMonths` is required."] }
```
`400` bad input · `401` not logged in · `403` not allowed · `404` not found · `409` conflict (duplicate, already decided).

### Auth — `/api/auth`
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/signup` | public | `{ name, email, password, role: adopter\|shelter, phone?, location? }` → `{ token, user }` |
| POST | `/login` | public | `{ email, password }` → `{ token, user }` |
| GET | `/me` | logged in | current user |

### Animals — `/api/animals`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | public | Filters: `species`, `breed`, `size`, `gender`, `ageGroup`, `minAge`/`maxAge` (months), `city`, `temperament` (comma list, all must match), `listingType`, `status` (default `available`), `q` (text). Paging: `page`, `limit` (≤ 50). `sort`: newest, oldest, youngest, eldest. Comma lists allowed, e.g. `species=dog,cat`. |
| GET | `/nearby` | public | `lng`, `lat`, `radius` (km, default 25) + any filter above. Nearest first. |
| GET | `/mine` | shelter | own listings |
| GET | `/:id` | public | includes owner name, rating, verified badge |
| POST | `/` | verified shelter, admin | create listing |
| PUT | `/:id` | owner, admin | update listing |
| DELETE | `/:id` | owner, admin | delete listing |

### Applications — `/api/applications`
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/` | adopter | `{ animalId, type, message?, answers?, fosterUntil? }` |
| GET | `/mine` | adopter | `?status=` |
| GET | `/received` | shelter | `?status=`, `?animal=` — includes applicant contact details |
| GET | `/:id` | applicant, shelter, admin | |
| PATCH | `/:id/status` | shelter, admin | `{ status: approved\|rejected, note? }` |
| PATCH | `/:id/withdraw` | applicant | only while pending |

`answers`: `homeType` (house/apartment/other), `hasYard`, `hasChildren`, `otherPets`, `hoursAlonePerDay`, `experience`.

### Messaging — `/api/threads` (logged in)
| Method | Path | Notes |
|---|---|---|
| POST | `/` | `{ animalId }` (chat with its shelter) or `{ recipientId }`. Returns the existing thread if there is one. |
| GET | `/` | your threads, most recent first, with `otherParticipant`, `lastMessage`, `unreadCount` |
| GET | `/unread-count` | total unread, for a nav badge |
| GET | `/:id/messages` | oldest first; `?limit=` (≤ 100), `?before=<messageId>` for older pages; `hasMore` in response |
| POST | `/:id/messages` | `{ text }` |
| PATCH | `/:id/read` | mark the other person's messages read |

Messages are not pushed in real time — poll `/unread-count` and the open thread every few seconds.

### Check-ins — `/api/checkins` (logged in)
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/mine` | adopter | `?status=pending\|completed\|overdue`, `?dueWithin=<days>`. Each item has `isOverdue`. |
| POST | `/:id/complete` | adopter | health update: `{ condition: great\|good\|fair\|poor, weightKg?, eatingWell?, vetVisit?, notes?, photos? }` |
| POST | `/` | adopter | `{ animalId, ...health update }` — log an update any time |
| GET | `/received` | shelter | check-ins for your animals |
| GET | `/animal/:animalId` | shelter, adopter, admin | the animal's history |

### Reviews — `/api/reviews` (logged in)
| Method | Path | Access | Notes |
|---|---|---|---|
| POST | `/` | adopter | `{ applicationId, rating: 1–5, comment? }` — one per approved adoption |
| PUT | `/:id` | reviewer | edit |
| DELETE | `/:id` | reviewer, admin | |

### Users — `/api/users`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/:id` | public | profile without email/phone; shelters include `stats`, `about` and `website` (from the verification request; never the registration number, document or admin note) |
| GET | `/:id/reviews` | public | paged, newest first |
| GET | `/:id/adoption-history` | shelters: public · adopters: self/admin | adopter entries include `reviewed` |
| PUT | `/me` | logged in | `{ name?, phone?, location? }` |

### Verification & admin
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/verification/me` | shelter | status + admin note |
| POST | `/api/verification/request` | shelter | `{ registrationNumber, about, website?, documentUrl? }` |
| GET | `/api/admin/shelters` | admin | `?status=pending\|approved\|rejected\|unsubmitted` |
| PATCH | `/api/admin/shelters/:id/verification` | admin | `{ decision: approve\|reject, note? }` |

Rejecting an approved shelter revokes it; existing listings stay live, new listings are blocked until re-approved.

---

## Integration notes

- **Photos:** the API stores photo URLs (`photos: [{ url, publicId }]`). Upload the file to the image host (e.g. Cloudinary) first, then send the returned URL. `publicId` is kept so the image can be deleted later.
- **Check-in reminders:** `server/services/checkInReminders.js` exposes `getDueReminders({ withinDays })` (due, not yet reminded, with adopter name/email) and `markReminded(ids)`. A cron job or scheduled function sends the emails and then marks them.
- **Demo setup:** create an admin, then verify each demo shelter account — unverified shelters can't publish listings.

## Security

- Passwords hashed with bcrypt; the hash is never returned.
- Public signup can only create adopters and shelters.
- Request bodies containing MongoDB operators (`$ne`, `$gt`…) are rejected.
- Every route validates input; a robustness test sends malformed data to every endpoint and fails on any server error.
- Ownership checks on every write: only the listing's shelter can edit it, only participants can read a thread, and so on.

## Testing

```bash
cd server
npm test          # API
cd ../client
npm test          # frontend helpers (Vitest)
```

70 tests across auth, animals, applications, messaging, check-ins, reviews, verification and robustness. They start a throwaway in-memory MongoDB (downloaded automatically on the first run), so they never touch your real database.

## Photo credits

Photo credits: demo pet photos collected from the internet, used only for this non-commercial student project.
