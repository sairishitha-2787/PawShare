# PawShare demo script (Review 2)

About 7 minutes. Two browser windows side by side, or switch between them:

- **Window A** (normal): the adopter, Ananya.
- **Window B** (incognito): the shelter Happy Tails, later the admin.

Timings are targets. If you're running late, shorten step 3; don't skip any step, because each one covers a feature in the brief.

## Demo logins

Every account uses the password **`PawShare@123`**.

| Who | Email | Used in |
|---|---|---|
| Ananya Rao (adopter) | `adopter@demo.pawshare.test` | Window A, steps 2–7 |
| Happy Tails Shelter, Koramangala (Biscuit, Clover, Tofu) | `shelter.koramangala@demo.pawshare.test` | Window B, steps 4–6 |
| Asha Admin | `admin@demo.pawshare.test` | Window B, step 8 |
| Stray Hearts Trust, HSR Layout (Pepper, Rocky, Peanut, Bruno) | `shelter.hsr@demo.pawshare.test` | spare: sees Ananya's check-ins for Bruno |
| Whisker Walk Rescue, Indiranagar (Mochi, Luna, Sushi) | `shelter.indiranagar@demo.pawshare.test` | spare |
| Bengaluru Paws Collective (no pets) | `shelter.bengaluru@demo.pawshare.test` | spare |
| Paws & Whiskers Foundation, JP Nagar (verification **pending**) | `shelter.jpnagar@demo.pawshare.test` | approved by the admin in step 8 |
| Little Paws Home, Whitefield (verification not submitted) | `shelter.whitefield@demo.pawshare.test` | spare |

## Before the demo

- [ ] **Reset the demo data** (from `server/`, pointing at the demo database):
      `npm run seed:demo -- --reset`. It prints what it deleted, then the seed lines. This undoes a rehearsal:
      Ananya's new applications, messages, reviews and check-ins go; Biscuit and the other map pets are back
      to their seeded status; Paws & Whiskers is pending again; Bruno is back to "1 month overdue".
- [ ] **The admin exists.** The seed doesn't create one; once per database run
      `npm run create-admin -- admin@demo.pawshare.test "PawShare@123" "Asha Admin"`.
- [ ] **Both servers running**: `server/` → `npm run dev` (API on :5000), `client/` → `npm run dev` (:5173). Or use the
      deployed URL. Open `/adopt` once to check that the 9 pets show with photos.
- [ ] **Internet on the demo machine**, even when running locally. The pixel fonts come from Google Fonts; offline,
      the app falls back to plain Courier and looks nothing like the design.
- [ ] **Browser zoom 100%**, window at least 1200px wide. Close DevTools, mute notifications.
- [ ] **Window B is incognito**, so the two logins don't share a token. Both windows start logged out, on `/`.
- [ ] **Clover's health record.** The reset doesn't touch listings. If a rehearsal already added a HEALTH.LOG record
      to Clover, don't add another in step 4: just show the existing one.
- [ ] Near me: the browser may ask for your location. Blocking it opens the area picker, which is what the script uses.

## The script

### 1. Home and the neighborhood map (0:00–0:50). *Brief: map view*

**Window A, logged out.**

- `/` is the desktop: "PawShare OS". Point at **README.TXT** and **PET_OF_THE_DAY.JPG**.
- Click **Open the neighborhood**.
- *Say:* "Every listed pet lives in a house on the street. The house shape is the species: doghouse, cat tower,
  birdhouse, hutch for small pets. The ring round the photo pin is the status: green available, pink urgent foster
  (it bounces), yellow adoption pending." Point at **KEY.TXT**, which counts each kind.
- *Say:* "On a phone the street scrolls sideways inside its window; the page itself never does."

### 2. Listings with photos and health records (0:50–1:30). *Brief: listings*

- Click **Biscuit's** doghouse. BISCUIT.PROFILE opens, and the URL is now `/adopt/<id>`, so the link can be shared.
- *Say:* "Each listing has a real photo, age, sex, size, breed, vaccination status, temperament tags and a
  description, all entered by the shelter." Point at the shelter link (**Happy Tails Shelter**) for step 7.
- Click **♡ Add to favorites**, then close the profile: FAVORITES/ now holds Biscuit.
- Health records come in step 4, when the shelter adds one.

### 3. Search, filters and nearby (1:30–2:30). *Brief: search + filters + nearby*

- Click the **Dogs** chip: 3 dogs. Click **All**.
- **More filters** opens FIND_PETS.EXE: tick **Size: Small**, **Find now**. The chips under the toolbar
  show the filters, and **Clear all** removes them.
- Type the keyword `zzzz` → the **ERROR** window: "No pets match these filters." Click **OK**. *(The one joke.)*
- **Near me** → block the location prompt if it appears → **Pick an area: Koramangala** → **5 km** chip.
  *Say:* "Nearby search uses the shelters' map coordinates; each pet shows its distance." Toggle **Full list**
  to show the distances, then **Map** and turn Near me off.
- *Say:* "Every filter is in the URL, so a search can be bookmarked or shared."

### 4. The shelter's side: listings and a health record (2:30–3:20). *Brief: listings with health records*

**Window B (incognito):** Start → **Log in** → `shelter.koramangala@demo.pawshare.test`.

- The taskbar changes for a shelter: **My pets**, **Inbox**, **My profile**.
- **My pets** → **Clover** → **Edit**. Scroll to HEALTH → **Add record**: *What was it* "Vaccination", today's date,
  vet "Dr. Meera Iyer" → **Save pet**.
- *Say:* "Shelters add and edit listings here: photos, temperament and health records. The preview shows the
  house the pet will get on the map."
- **Window A:** open **Clover** on the map: the new **HEALTH.LOG** is on her profile.

### 5. Application workflow and approval (3:20–4:50). *Brief: application workflow + approval*

**Window A:** Start → **Log in** → `adopter@demo.pawshare.test`. You land back on the map.

- Open **Biscuit** → **Start adoption application**. APPLY.EXE has three steps: *What kind of home* (Adopt), *About your
  home* (apartment, no yard, no children, 3 hours alone), *Message*. The last step shows everything for review
  → **Send application**.
- The taskbar now says **Applications (1 pending)**; open it to show MY_APPLICATIONS/ with Biscuit **pending**.
  *Say:* "Biscuit's pin turns yellow: adoption pending."

**Window B (Happy Tails):** the taskbar shows **Inbox (1 pending)**. Open it.

- Click Ananya's application. The reading pane shows her answers and message.
- Type a note ("Lovely match, see you Saturday!") → **Approve** → **Yes, approve**.
- *Say:* "Approving closes any other pending applications for Biscuit, marks him adopted and schedules the
  follow-up check-ins: 1 week, 1 month and 3 months."

**Window A:** open Biscuit's application: **Approved**, with the shelter's note.

### 6. Messaging (4:50–5:30). *Brief: messaging*

- **Window A:** in Biscuit's application (or on any profile) → **Message the shelter** → "Can I bring his bed from the
  shelter?" → Send.
- **Window B:** the taskbar shows **Messages (1)** within about 15 seconds. Open it and reply "Of course!".
- **Window A:** the reply appears in the open chat (it refreshes every 5 seconds).
- *Say:* "Each conversation is about one pet, and unread counts show in the taskbar."

### 7. Check-ins, shelter profiles and ratings (5:30–6:30). *Brief: check-ins, shelter profiles/ratings*

**Window A (Ananya):** open **Check-ins** from the taskbar. PET_DIARY.EXE now starts with **Biscuit**, adopted a
minute ago: his 1 week check-in is "Due in 7 days", and there's a **Rate Happy Tails Shelter** button. Scroll down to **Bruno**,
adopted from Stray Hearts 35 days ago:

- The timeline has **1 week** done, **1 month** overdue and **3 months** still to come.
- **Fill in 1 month check-in** → CHECKUP.EXE: condition **Great**, weight `32`, eating well **Yes** → **Save check-in**.
  The stop turns green and the entry lands in HEALTH.LOG.
- *Say:* "The shelter sees these in its CHECKINS.EXE, with overdue ones flagged." (Optional: log in as
  `shelter.hsr` to show it.)
- Click **Stray Hearts Trust** → STRAY_HEARTS_TRUST.INFO: **General** (about, verified, stats),
  **Reviews** (Ananya's 5 stars), **History** (Bruno adopted).
- *Say:* "Only an adopter with an approved application can rate a shelter, once per adoption. The rating
  shows on the profile and next to the shelter name." (If there's time: back in PET_DIARY, **Rate Happy Tails Shelter**
  opens REVIEW.EXE for Biscuit.)

### 8. Admin verification (6:30–7:00). *Brief: admin verification*

**Window B:** **Log out** → **Log in** → `admin@demo.pawshare.test`.

- The taskbar shows **Control panel (1)**. CONTROL_PANEL.EXE → **Verification** → **Paws & Whiskers Foundation**
  (pending): registration number, about text, website.
- **Approve** → **Yes, approve**. It moves to **Approved (5)** and gets the VERIFIED badge.
- *Say:* "Unverified shelters can't list pets. An admin checks the registration and approves, rejects with a
  note, or revokes later. The admin can also remove reviews and listings from the same panel."

**Wrap up (one line):** "Shelters list pets on a neighborhood map, adopters search, apply and chat, and after the adoption,
check-ins and reviews keep everyone honest. Admins make sure every shelter is real."

## Backup plan

**The database is down** (Atlas unreachable, or the API won't start):

1. In `client/`, create or edit `.env.local`: `VITE_USE_MOCK=true`.
2. Restart the client (`npm run dev`). The desktop and the neighborhood show the 9 built-in sample pets.
   The map, profiles, species chips and the "urgent foster" filter work without an API.
3. Do steps 1–3 live on the mock data (skip Near me and More filters, which need the API), then walk
   through steps 4–8 using the screenshots in `docs/screenshots/` and the README.
4. Afterwards, set `VITE_USE_MOCK=false` again.

**Other things that can go wrong:**

- *Stuck on "LOADING..." or "Couldn't reach the server":* the API isn't running, or `VITE_API_URL` points somewhere
  else. Restart `server/` with `npm run dev`.
- *A step's data is already used* (Biscuit already adopted, Paws & Whiskers already approved): someone skipped the reset.
  Run `npm run seed:demo -- --reset`, then refresh both windows (the tokens stay valid).
- *Logged into the wrong account:* use **Log out** in the taskbar, or the Start menu on a narrow window.
