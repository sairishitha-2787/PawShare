# PawShare

Pet adoption and community foster care platform. Shelters and caregivers list animals, adopters search and apply, and adoptions are tracked through approval, messaging and post-adoption check-ins.

**Team:** Sai Rishitha (24WU0101123) · Poojitha Arigela (24WU0101144) · Vedha Sri (24WU0104032)

**Stack:** MongoDB · Express 5 · React · Node.js — this repo currently holds the backend API (`server/`).

---

## Getting started

Requirements: Node.js 20+ and a MongoDB database (a free MongoDB Atlas cluster works).

```bash
cd server
npm install
cp .env.example .env        # then fill in the values below
npm run create-admin -- admin@pawshare.com "change-me-123" "Admin"
npm run dev                 # http://localhost:5000/api/health → {"status":"ok"}
```

### Environment variables (`server/.env`)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `MONGODB_URI` | yes | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/pawshare` | Database connection |
| `JWT_SECRET` | yes | any long random string | Signs login tokens. The server refuses to start without it. |
| `PORT` | no | `5000` | API port |
| `CLIENT_URL` | no | `http://localhost:5173` | Allowed CORS origin (the React app). Defaults to any origin. |

### Scripts (run inside `server/`)

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-restart (nodemon) |
| `npm start` | Start for production |
| `npm test` | Run the test suite on an in-memory MongoDB — no Atlas needed |
| `npm run create-admin -- <email> <password> ["Name"]` | Create an admin, or promote an existing user. Admins can't sign up through the API. |
| `npm run seed:demo` | Add the demo shelters, pets and adopter below. Safe to re-run: updates them in place. |

### Demo accounts

Created by `npm run seed:demo`. Every account uses the password `PawShare@123`.

| Email | Role | What's there |
|---|---|---|
| `shelter.koramangala@demo.pawshare.test` | shelter | Happy Tails Shelter: Biscuit, Clover, Tofu |
| `shelter.indiranagar@demo.pawshare.test` | shelter | Whisker Walk Rescue: Mochi, Luna, Sushi |
| `shelter.hsr@demo.pawshare.test` | shelter | Stray Hearts Trust: Pepper, Rocky, Peanut, and Bruno (adopted) |
| `shelter.bengaluru@demo.pawshare.test` | shelter | Bengaluru Paws Collective (no pets yet) |
| `adopter@demo.pawshare.test` | adopter | Ananya Rao. Adopted Bruno from Stray Hearts Trust 35 days before the first seed: 1-week check-in done, 1-month overdue, 3-month still to come. |

---

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
| GET | `/:id` | public | profile without email/phone; shelters include `stats` |
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
npm test
```

69 tests across auth, animals, applications, messaging, check-ins, reviews, verification and robustness. They start a throwaway in-memory MongoDB (downloaded automatically on the first run), so they never touch your real database.

## Photo credits

Photo credits: demo pet photos collected from the internet, used only for this non-commercial student project.
