# PawShare frontend — Claude Code session prompts

Build the Neighborhood map page in React so it matches the approved mockup, one session at a time.

## Before session 1

1. Put these files in the root of your repo:
   - `CLAUDE.md` (Claude Code reads it automatically at the start of every session)
   - `design/neighborhood-reference.html` (the mockup; open it in Chrome to see the target)
2. Commit them: `git add CLAUDE.md design && git commit -m "docs: add design reference"`.

## How to run the sessions

- **Start a fresh Claude Code session for each prompt** (`/clear` or a new terminal). Paste the whole prompt.
- Don't move on until every item in that session's "Done when" list is true. If something is off, stay in the
  same session and describe what's wrong ("the cat tower roof is flatter than the reference").
- Commit at the end of each session. If a session goes badly, `git reset --hard` and rerun the prompt.
- Sessions 1–7 build the page with mock data. Session 8 connects it to Poojitha's API, so run it once
  `GET /api/animals` exists.

---

## Session 1 — Project setup and design tokens

```text
Read CLAUDE.md and open design/neighborhood-reference.html (read the <style> block carefully).

Set up the frontend in client/:
1. If client/ doesn't exist, scaffold it with Vite (React, JavaScript). If it exists, keep what's there and only add.
2. Install react-router-dom. Don't install any UI or CSS framework.
3. Add the Google Fonts link for Silkscreen (400,700) and Fredoka (400,500,600) in client/index.html, with preconnect.
4. Create src/styles/tokens.css with the exact CSS variables from CLAUDE.md.
5. Create src/styles/global.css: box-sizing, [hidden]{display:none!important}, the body background (28px grid
   lines in --grid over the linear gradient #D8F1EC → #F7EFFA 40% → #FFF3DC), body font Fredoka 15px/1.5,
   color --ink, padding-inline 16px, :focus-visible ring. Copy values from the reference body rule.
6. Routes: "/" → AdoptPage (placeholder for now that shows the "PAWSHARE OS" header exactly like the
   reference .brand block), "/dev/kit" → DevKit (empty page for now).
7. Delete Vite's demo CSS/logo files.

Done when: `npm run dev` shows the grid background and the PAWSHARE OS header (SHARE in #E9668E) in the right
fonts; `npm run build` passes. Commit: "chore(client): vite setup, tokens, global styles".
```

## Session 2 — Window UI kit

```text
Read CLAUDE.md. Look at these parts of design/neighborhood-reference.html: .win, .bar (+ .pink/.mint/.sun),
.dots, .xbtn, .chip, .seg, .btn, .pill, .urgent, .err, .scrim, .taskbar, .start, .task, .clock.

Build these components in src/components/ui/, each with its own .css file, copying the reference styles exactly:
- Window({ title, barColor: 'lav'|'pink'|'mint'|'sun', dots=true, onClose, children, className })
  onClose renders the X button instead of the dots. Title is uppercase Silkscreen.
- Chip({ pressed, onClick, children })            – aria-pressed, yellow when pressed
- SegToggle({ options:[{value,label}], value, onChange })  – the pill-shaped Map / Full list switch
- Button({ variant:'default'|'primary', ...props })
- Pill({ status })                                 – uses status colors from CLAUDE.md, label text in caps
- ErrorDialog({ message, onOk })                   – pink ERROR window, centered, role="alertdialog"
- Modal({ open, onClose, labelledBy, children })   – dim scrim rgba(58,51,85,.38); closes on Esc and on scrim
  click; moves focus to the close button on open and returns focus to the trigger on close
- Taskbar({ items })                               – "start" button, task tabs, live clock (HH:MM, updates every 30s)

Fill /dev/kit with every component in every variant, so we can eyeball them next to the reference.

Done when: /dev/kit looks the same as the matching pieces of the reference (borders, offset shadows, pressed
effect, fonts, sizes). Build and lint pass. Commit: "feat(ui): window ui kit".
```

## Session 3 — Pet faces, houses and pins (SVG components)

```text
Read CLAUDE.md. In design/neighborhood-reference.html, study the JS functions face(), houseShape(), houseSVG(),
and the PETS array.

1. Create src/data/mockPets.js with the 9 pets from the reference PETS array. Convert them to the pet shape in
   CLAUDE.md: move fur/dark/bg into `colors`, drop x/y and house (house is derived).
2. src/utils/pets.js: houseTypeFor(species), STATUS_COLOR, STATUS_LABEL, SPECIES_LABEL (copy from reference).
3. Port to React SVG components in src/components/pets/, keeping every coordinate, color and stroke identical:
   - PetFace({ pet, size })  – the 60×60 face for dog, cat, bunny, guinea. Use React's useId() for the clipPath
     id so faces never clash. If pet.photoUrl exists, show the photo clipped to the same circle instead.
   - House({ type, x, y })   – returns the <g> for dog / cat / hutch plus the shadow ellipse. Export a
     peakY(type, y) helper (dog y-80, cat y-106, hutch y-72).
   - Pin({ pet, x, cy })     – drop pointer + ring circle in status color + nested 40×40 PetFace + inner outline.
   - HouseMarker({ pet, x, y, onOpen, dimmed }) – House + name plate + Pin, exactly like houseSVG(). It's a
     role="button" with tabindex, aria-label "Mochi, Cat, Urgent foster. Open profile", opens on click,
     Enter and Space. Hover/focus lifts the pin 7px; urgent pins bob (2.4s). Both off under reduced motion.
     dimmed → opacity .2, no pointer events, tabindex -1.
4. On /dev/kit add a row with each face at 64px and each house type with a pin, inside an <svg viewBox>.

Watch out: nested <svg> inside the map must NOT pick up width rules meant for the outer svg (scope CSS with
a direct-child selector).

Done when: the faces and houses on /dev/kit match the reference pixel for pixel by eye. Commit:
"feat(pets): svg faces, houses, pins".
```

## Session 4 — The neighborhood scene

```text
Read CLAUDE.md. In design/neighborhood-reference.html study drawScene(), sparkle(), cloud(), tree(), flowers(),
.mapwrap and the house coordinates in PETS.

1. src/components/map/SceneBackdrop.jsx: port everything drawScene() draws except the houses – sky gradient,
   smiling sun, clouds, sparkles, two hill layers, the dirt path with dashed centre line, pond, trees, flowers,
   and the PAWSHARE LN signpost. Same coordinates, viewBox 0 0 1000 560.
2. src/components/map/lots.js: export LOTS, the 9 {x,y} positions taken from the reference PETS (Biscuit 140,318;
   Mochi 290,268; ... Peanut 780,478), in that order.
3. src/components/map/Neighborhood.jsx({ pets, isDimmed, onOpen }):
   - outer <svg viewBox="0 0 1000 560"> with SceneBackdrop, then one HouseMarker per pet placed on LOTS[i]
   - render markers sorted by y so nearer houses draw on top
   - wrapper .mapwrap: 2px ink border, radius 10px, overflow-x auto; the svg has min-width 720px
   - if there are more than 9 pets, show only 9 and add a "Next street →" / "← Previous street" pair of Buttons
     under the map (page through in groups of 9)
   - hint line under the map: "Click a house to open that pet's profile. On a small screen, swipe the map sideways."
4. Put it inside a Window titled "NEIGHBORHOOD.EXE — 9 pets nearby" on AdoptPage, using mockPets.
   For now onOpen just console.logs the id.

Done when: the page at 1200px looks like the reference map, houses are clickable and keyboard-focusable, and at
400px the map scrolls sideways inside its box while the page itself doesn't. Commit: "feat(map): neighborhood scene".
```

## Session 5 — Filters, legend, list view, favorites panel

```text
Read CLAUDE.md. In design/neighborhood-reference.html study .toolbar, .main grid, the KEY.TXT and FAVORITES/
windows, keyRow(), matches(), update(), renderList(), renderFavs() and the empty-results ERROR.

Build the rest of AdoptPage around the map:
1. Toolbar: species Chips (All / Dogs / Cats / Small pets – small = bunny + guinea), the "Needs a foster urgently"
   checkbox, and SegToggle Map / Full list on the right. Keep filter state in AdoptPage; the selected view in the
   URL hash (#list) so it survives refresh.
2. Filtering dims non-matching houses on the map (don't remove them). The title bar count updates.
3. Legend.jsx (KEY.TXT window, sun title bar): "HOUSE = SPECIES" rows with a mini house SVG, label, sub-label and a
   count badge; "PIN RING = STATUS" rows with ring swatches and counts. Counts reflect the current filter.
4. FavoritesContext: a Set of pet ids saved in localStorage key "pawshare-favs" (wrap in try/catch). The
   FAVORITES/ window lists saved pets as pink pill buttons that open the profile; empty text:
   "Folder is empty. Tap the heart on a profile to save a pet here." Taskbar shows "Favorites (n)".
5. List view: PetCard grid (auto-fill, min 210px) like renderList() – title bar "MOCHI.CAT", face, name, age · breed,
   area, Pill, Open button. Title bar color by house type (dog pink, cat lavender, hutch sun).
6. When nothing matches, show ErrorDialog over the map: "NO CATS NEED AN URGENT FOSTER RIGHT NOW." (species word
   changes). OK unticks the urgent checkbox.
7. Layout: map + 250px sidebar; below 860px the sidebar goes under the map. Taskbar at the bottom of the page.

Done when: every filter combination behaves like the reference, Small pets + urgent shows the ERROR, and the list
view shows the same pets as the map. Commit: "feat(adopt): filters, legend, list view, favorites".
```

## Session 6 — Profile window

```text
Read CLAUDE.md. In design/neighborhood-reference.html study openPet(), .profile, .phead, .stats, .tags, .actions, .note.

Build src/components/pets/ProfileWindow.jsx inside the Modal from session 2:
- Title bar "<NAME>.PROFILE" with the X close button.
- Header: 120px PetFace in a circle, name (Silkscreen 26px), "Cat · Whisker Walk Rescue, Indiranagar", Pill.
- Stats grid (3 columns, 2 on phones): AGE, SEX, SIZE, BREED (spans 2), VACCINES.
- Tag chips in mint, the blurb, then actions:
  primary button text: urgent → "Offer to foster", available → "Start adoption application",
  pending → "Join the waitlist". Clicking shows the dashed mint note with the matching sentence from the
  reference (for now; session 8 wires the real application).
  Favorite button: "♡ Add to favorites" / "♥ Saved to favorites", aria-pressed, uses FavoritesContext.
- Opens from map houses, list cards and the favorites panel. Esc, X and scrim click close it; focus returns to
  the house that opened it.
- Add a deep link: /adopt/:petId opens the page with that profile already open.

Done when: opening Mochi looks like the reference profile at 1200px and 400px, and favorites update everywhere
instantly. Commit: "feat(pets): profile window".
```

## Session 7 — Polish and match check

```text
Read CLAUDE.md. Open design/neighborhood-reference.html and our app side by side at 1200px, 860px and 400px.

1. Go section by section (header, toolbar, map, legend, favorites, list, profile, error, taskbar) and list every
   visual difference: spacing, font size, border, shadow, color, radius, wrapping. Show me the list first.
2. Then fix them all.
3. Accessibility pass: every control reachable by Tab in a sensible order, visible focus, aria-labels on houses,
   Modal traps focus, reduced motion respected, colour isn't the only status signal (pills have text).
4. Check there's no horizontal page scroll at 400px and no console warnings (keys, useId, etc.).

Done when: I can't tell the two apart at a glance. Build and lint pass. Commit: "fix(ui): match reference".
```

## Session 8 — Connect to the backend (run once the API exists)

```text
Read CLAUDE.md. Look at server/ to find the animals routes and the Animal model (read only, don't edit server/).

1. src/api/client.js: fetch wrapper with VITE_API_URL, JSON parsing, and an Error that carries the server message.
2. src/api/animals.js: getAnimals(filters), getAnimal(id). Write a toPet(apiAnimal) mapper from the Mongo document
   to our pet shape in CLAUDE.md. Map species values we don't draw yet to 'guinea' (hutch) and tell me which
   ones you mapped. If the API has no fur colors, pick colors from a fixed palette by hashing the id so each pet
   always gets the same colors. Use the first photo as photoUrl.
3. Map status from the API (e.g. available / needs_foster / pending / adopted) to available / urgent / pending;
   don't show adopted animals on the map.
4. AdoptPage loads from the API with a loading state (a Window titled "LOADING..." with a pixel progress bar) and
   an error state using ErrorDialog ("COULDN'T REACH THE SHELTER SERVER." + Retry). Keep mockPets as the fallback
   when VITE_USE_MOCK=true.
5. Send species/urgent filters as query params if the API supports them; otherwise filter on the client.
6. The profile's primary button navigates to /apply/:petId (create an empty placeholder page for now).

Done when: with the server running, real animals appear in the houses and profiles; with the server off, the
error window shows and Retry works. Commit: "feat(api): load animals from backend".
```

## Session 9 — Login and signup

```text
Run `git checkout main && git pull`, then create `feature/auth` from main.

Read CLAUDE.md and the "Auth — /api/auth" section of README.md (POST /signup, POST /login, GET /me;
protected routes need `Authorization: Bearer <token>`; tokens last 7 days; errors are { message, errors[] }).
Don't change server/.

1. src/api/auth.js: signup(data), login(email, password), getMe(). Update api/client.js so it adds the Bearer
   token when one is saved, and on a 401 clears the token.
2. src/context/AuthContext.jsx: { user, token, loading, login, signup, logout }. Token in localStorage key
   "pawshare-token" (try/catch). On app start, if a token exists call getMe(); if it fails, log out quietly.
3. Pages, built only from our ui kit (Window, Button, Chip...), centred on the grid background, max-width 420px:
   - /login: Window "LOGIN.EXE". Email, password, "Log in" (primary). Link: "New here? Create an account".
   - /signup: Window "NEW_USER.EXE". Name, email, password (min 8), "I am..." as two Chips: "Looking to adopt
     or foster" (adopter) / "A shelter or caregiver" (shelter), city (Bengaluru default), phone optional.
   - Labels in Silkscreen 11px uppercase, inputs in Fredoka 15px with 2px ink border, 8px radius, paper
     background, the pink focus ring. Show field errors under each field, and the server's message in a
     pink ERROR-style box above the button. Disable the button and show "LOGGING IN..." while waiting.
   - A shelter signing up sees a note: "Shelters need admin verification before they can list animals."
4. RequireAuth wrapper: sends logged-out users to /login and back to where they were after logging in
   (keep the target in router state, not the URL).
   Protect /apply/:petId with it.
5. Taskbar: when logged out show a "Log in" task button; when logged in show "<first name> · adopter|shelter"
   and a "Log out" button. Favorites stay local for now.
6. Append this prompt to docs/claude-prompts.md as "Session 9 — Login and signup".

Done when: signup → lands back on the Adopt page logged in; refresh keeps you logged in; wrong password
shows the server's message; clicking "Start adoption application" while logged out goes to /login and then
on to /apply/<id> after logging in; Log out works. Lint and build pass. Commit: "feat(auth): login and signup".
```

## Session 10 — Application form

```text
Run `git checkout main && git pull`, then create `feature/apply-form` from main.

Read CLAUDE.md, the "Applications — /api/applications" section of README.md, and
server/controllers + server/models for Application (read only, don't change server/).
Check exactly which fields POST /api/applications accepts and which errors it returns (duplicate application,
animal not available, wrong role), and use those rules. Tell me what you found before building.

Build /apply/:petId (already behind RequireAuth) as a setup wizard in one Window titled "APPLY.EXE — <PET NAME>":
1. Top of the window: small pet summary (PetFace or photo 64px, name, species · shelter, area, Pill) and a pixel
   progress bar "STEP 1 OF 3" in Silkscreen.
2. Step 1 "What kind of home?": two Chips, "Adopt" / "Foster". Default: Foster for urgent pets, Adopt otherwise.
   If Foster: a "Foster until" date input (must be in the future).
3. Step 2 "About your home" (the `answers` object): home type (House / Apartment / Other chips), has a yard
   (yes/no), children at home (yes/no), other pets (short text), hours the pet would be alone per day (number
   0–24), experience with pets (textarea). Use the exact field names and allowed values the server expects.
4. Step 3 "Say hello": message to the shelter (textarea, optional, max length from the model if it has one), then
   a read-only summary of every answer with "Edit" links back to steps 1–2.
5. Buttons at the bottom right: "Back" and "Next" / "Send application" (primary). Validate each step before Next;
   show errors under the fields. While sending: "SENDING..." and disabled.
6. Success: replace the wizard with a mint window "APPLICATION SENT" — "<Shelter> will review your application.
   You'll see its status under My applications." Buttons: "Back to the neighborhood" and "My applications"
   (link to /applications; create a placeholder page there for session 11).
7. Errors: show the server's message in the pink ERROR box. Special cases: a shelter account sees
   "Shelter accounts can't apply. Log in with an adopter account." instead of the form; if the user already
   applied for this pet, show that with a link to My applications.
8. Reuse the form input styles from the login pages (move them into a shared FormField component if they aren't
   already). Works at 400px.
9. Append this prompt to docs/claude-prompts.md as "Session 10 — Application form".

Done when: as an adopter, applying for Biscuit goes through all 3 steps and creates the application (check it
appears via GET /api/applications/mine); applying again shows the "already applied" message; Mochi defaults
to Foster; a shelter account sees the shelter message. Lint and build pass.
Commit: "feat(apply): adoption and foster application wizard".
```

---

## Session 11 — My applications

```text
Run `git checkout main && git pull`, then create `feature/my-applications` from main.

Read CLAUDE.md, the "Applications" section of README.md, and server/models + controllers for Application
(read only). Check the exact status values, what GET /api/applications/mine and GET /api/applications/:id
return (populated animal/shelter?), and the rules for PATCH /:id/withdraw. Tell me what you found first.

Build /applications (behind RequireAuth, adopters only; a shelter account is sent to /shelter/applications,
which is a placeholder page until session 12):
1. Window "MY_APPLICATIONS/" (pink title bar). Status Chips across the top: All / Pending / Approved /
   Rejected / Withdrawn, with counts. Filtering happens on the client.
2. Rows styled like files in a folder: pet face or photo 40px, "<PETNAME>.APP" in Silkscreen, Adopt/Foster
   tag, shelter name, "Sent 25 Sept" (en-IN date), and a status Pill (pending sun, approved mint,
   rejected pink, withdrawn lavender with text, never colour only). Newest first. Whole row is a button.
3. Clicking a row opens a detail Window in the Modal: pet summary, status with the decided date, the
   shelter's note if there is one, the answers the adopter gave (read-only, same labels as the wizard),
   the message, and foster-until date for fosters.
   - Pending: a "Withdraw application" button. Confirm inside the window (no confirm()): "Withdraw your
     application for Mochi?" with "Yes, withdraw" / "Keep it". Then refresh the list.
   - Approved: mint note "Approved! <Shelter> will be in touch." plus a "Message the shelter" button
     (link to /messages, placeholder page until session 14).
4. Empty folder: "No applications yet." and a "Browse the neighborhood" button. Loading: the LOADING window
   from session 8. Error: ErrorDialog with Retry.
5. Support /applications/:id deep link (opens the detail), and make the wizard's success screen and the
   "already applied" message link to the right application.
6. Taskbar: when logged in as an adopter, add an "Applications (n pending)" task button.
7. Append this prompt to docs/claude-prompts.md as "Session 11 — My applications".

Done when: after applying for Biscuit and Mochi, both show up as Pending with the right type; filters and
counts work; withdrawing Biscuit moves it to Withdrawn and the pet can be applied for again (if the server
allows); the detail deep link works; works at 400px. Lint and build pass.
Commit: "feat(apply): my applications folder".
```

---

## Session 12 — Shelter inbox

```text
Run `git checkout main && git pull`, then create `feature/shelter-inbox` from main.

Read CLAUDE.md, the "Applications" section of README.md, and server/controllers + models for Application
(read only). Check what GET /api/applications/received returns (applicant contact details, populated animal),
the rules for PATCH /:id/status (who may call it, allowed values, what happens to other pending applications
and to the animal's status when one is approved). Tell me what you found first.

Also: tell me the demo shelter logins from the seed script (email + password). If the seed script doesn't
set known passwords, add them and list them in README.md under "Demo accounts". That is the only server/
change allowed in this session.

Build /shelter/applications (behind RequireAuth, shelters and admins only; adopters are sent to /applications),
replacing the placeholder:
1. Window "INBOX.EXE" (mint title bar). Toolbar: status Chips (Pending / Approved / Rejected / Withdrawn / All,
   with counts; Pending selected by default) and a pet dropdown ("All pets" + each of the shelter's animals).
2. Two panes (stack to one column below 860px, list first):
   - Left: message-style rows: pet face/photo 40px, applicant name (bold if pending), "wants to adopt Mochi" /
     "wants to foster Mochi", date, status Pill. Selected row highlighted in --lav-soft.
   - Right (reading pane): applicant name, email and phone as selectable text with a Copy button each (catch
     clipboard errors), pet summary, Adopt/Foster + foster-until, the shared read-only answers component,
     their message, date sent.
3. Pending applications get a decision box at the bottom of the reading pane: optional "Note to the applicant"
   textarea, "Approve" (primary) and "Reject" buttons. Confirm inside the pane (no confirm()):
   - Approve: "Approve <name> for Mochi? The other N pending applications for Mochi will be rejected
     automatically." (N from the list; leave the sentence out if 0) → "Yes, approve" / "Cancel".
   - Reject: "Reject <name>'s application?" → "Yes, reject" / "Cancel".
   After success, refresh the list and keep the pane open on the decided application, showing the decision,
   the date and the note.
4. Decided applications show the decision read-only. Approved ones get a "Message <name>" button (link to
   /messages, still a placeholder until session 14).
5. Empty: "No pending applications. New ones will show up here." Loading/error: same LOADING window and
   ErrorDialog + Retry as other pages. Deep link /shelter/applications/:id selects that application.
6. Taskbar for shelters: "Inbox (n pending)" task button. If the logged-in shelter isn't verified, show a sun
   note at the top: "Your shelter isn't verified yet. You can review applications, but new listings need
   admin approval."
7. Works at 400px. Append this prompt to docs/claude-prompts.md as "Session 12 — Shelter inbox".

Done when: as the demo shelter that owns Mochi, two adopters' pending applications for Mochi appear; approving
one shows the confirm text with "1 other", approves it, rejects the other automatically, and Mochi no longer
shows on the neighborhood map; logging in as each adopter shows Approved / Rejected in My applications with the
shelter's note. Lint and build pass. Commit: "feat(shelter): applications inbox".
```

---

## Session 12b — Demo pet photos

```text
Run `git checkout main && git pull`, then create `feature/pet-photos` from main.

1. Add `PHOTOS/` to the root .gitignore (raw source photos must never be committed).
2. Copy the 9 ready-made 400×400 JPEGs from PHOTOS/demo-pets/ into client/public/demo-pets/
   (biscuit, mochi, clover, pepper, luna, rocky, tofu, sushi, peanut .jpg). Don't resize them again.
3. Add 'hamster' as a small-pet species: house type hutch, included in the "Small pets" filter, label "Hamster",
   cartoon face = the guinea face for now. Check server/models/Animal allows 'hamster'; if it doesn't, tell me
   and use the closest allowed value instead of changing the model.
4. Update the pet details in client/src/data/mockPets.js AND the server seed script so they match the photos:
   Biscuit → Golden Retriever; Pepper → Labrador mix; Luna → grey British Shorthair mix, 4 months, tags
   Playful / Curious / Indoor only (no grooming tag); Rocky → Golden Retriever (senior); Sushi → ginger Persian
   mix, fix the blurb; Tofu → dwarf hamster, 6 months; Peanut → Syrian hamster, 1 year, blurb no longer mentions
   guinea pigs. Keep names, ids, statuses and shelters the same.
5. Set photoUrl "/demo-pets/<id>.jpg" in mockPets, and in the seed script set photos:
   [{ url: `${CLIENT_URL || 'http://localhost:5173'}/demo-pets/<id>.jpg` }]. Re-run the seed on the dev database.
6. Check the photo sits correctly in the pin (40px), the list card (64px) and the profile (120px).
7. README.md: add "Photo credits: demo pet photos collected from the internet, used only for this
   non-commercial student project."
8. Append this prompt to docs/claude-prompts.md.
Commit: "feat(pets): real demo photos".
```

---

## Session 13 — Shelter listings

```text
Run `git checkout main && git pull`, then create `feature/shelter-listings` from main.

Read CLAUDE.md, the "Animals" section and "Integration notes → Photos" in README.md, and server/models/Animal
+ the animals controller (read only, don't change server/). Check: every field and allowed value (species is
dog/cat/bird/rabbit/other; hamsters are 'other' with "hamster" in the breed), size, gender, listingType, status,
temperament, the healthRecords shape, location, photo limit, which fields PUT accepts, who can POST (verified
shelters only?), and what DELETE does when the animal has pending applications. Tell me what you found first.

1. /shelter/animals (shelters + admins, RequireAuth): Window "MY_PETS/" (sun title bar) listing GET /animals/mine
   as the same PetCard grid as the list view, with a status Pill and "Edit" / "Remove" buttons on each card.
   Top: "Add a pet" primary button. Status chips: All / Available / Pending / Adopted / Fostered.
   If the shelter isn't verified: disable "Add a pet" and show the sun note "Your shelter needs admin
   verification before you can list animals."
2. /shelter/animals/new and /shelter/animals/:id/edit: one form in a Window "ADD_PET.EXE" / "EDIT_<NAME>.EXE",
   built from the shared FormField + Chip components, in four titled sections:
   - BASICS: name, species chips (Dog / Cat / Bird / Rabbit / Hamster / Other small pet → Hamster saves as
     'other' + breed containing "hamster"), breed, age (number + months/years toggle → stored as ageMonths),
     gender, size chips, listing type (Adopt / Foster chips), city.
   - PERSONALITY: temperament tags as toggle chips from the server's allowed list (or free-text chips if it's
     open), description if the model has one.
   - HEALTH: vaccinated and neutered (yes/no), and a HEALTH.LOG list of health records using the model's fields
     (e.g. date + title + notes) with "Add record" and a remove button per row.
   - PHOTOS: up to the model's limit. Upload via src/api/uploads.js → Cloudinary unsigned upload using
     VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET (store { url, publicId }). Before uploading,
     centre-crop to a square and resize to 800×800 in the browser (canvas) so pins look right. Thumbnails in
     64px circles; first photo = "Main photo", "Make main" to reorder. If the env vars are missing, show a
     "Paste image URL" field instead. Images only, max 5 MB, show upload progress.
   - Live preview in a side column: the HouseMarker + Pin exactly as it will look on the map.
   Validate before saving; show server errors in the pink ERROR box; "SAVING..." while waiting. After saving,
   go back to MY_PETS/ with a mint "Saved <Name>." note.
3. Remove: confirm inside the card ("Remove Mochi from PawShare?" → "Yes, remove" / "Cancel"). If the server
   refuses because of applications, show its message.
4. Birds: add a birdhouse house type (a small house on a pole with a round entrance hole and a perch, roof
   #B8A6E0, same SVG style and 2px ink stroke as the others, export its peakY), a cartoon bird face, a legend
   row "Birdhouse — Birds", and a "Birds" filter chip. mapSpecies: 'bird' → bird.
5. Profile window (adopter view): add a HEALTH.LOG section showing the health records, and show the main photo
   large in the header when there is one.
6. Taskbar for shelters: "My pets" task button. Add VITE_CLOUDINARY_* to client/.env.example.
7. Works at 400px (the preview column moves under the form). Append this prompt to docs/claude-prompts.md as
   "Session 13 — Shelter listings".

Done when: logged in as shelter.koramangala@demo.pawshare.test / PawShare@123, adding "Kiwi" (bird, cockatiel,
2 years, adopt, 1 health record, 1 photo) makes her appear on the neighborhood map in a birdhouse with her photo
on the pin; editing her breed shows in her profile; removing her takes her off the map; adding "Coco" (cat,
foster) gives a pink pin; an unverified shelter can't add pets. Lint and build pass.
Commit: "feat(shelter): add and edit animal listings".
```

---

## Tips

- If Claude Code starts using Tailwind, a component library or emoji, say "Follow CLAUDE.md, remove that."
- Ask it to take its time on SVG sessions (3 and 4): "Copy the coordinates exactly from the reference; don't
  redraw them."
- Keep this file in the repo too (`docs/claude-prompts.md`) so Poojitha and Vedha can see how the UI was built.
