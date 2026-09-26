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

## Session 14 — Messaging

```text
Run `git checkout main && git pull`, then create `feature/messaging` from main.

Read CLAUDE.md, the "Messaging — /api/threads" section of README.md, and server/models + controllers for
Thread and Message (read only, don't change server/). Check: request/response shapes, max message length,
how a thread is keyed (one per pair per animal), pagination with ?before and hasMore, and what PATCH /:id/read
does. Messages are NOT pushed in real time, so we poll. Tell me what you found first.

Build /messages and /messages/:threadId (RequireAuth, adopters and shelters), replacing the placeholder:
1. src/api/threads.js: listThreads, unreadCount, startThread({ animalId } | { recipientId }),
   getMessages(id, { before, limit }), sendMessage(id, text), markRead(id).
2. Window "MESSENGER.EXE" (lavender title bar), two panes (below 860px show one at a time: the list, then the
   chat with a "← Back" button):
   - Left "CONTACTS": one row per thread, most recent first: other person's name, the pet's name + small
     face/photo, last message preview (one line, ellipsis), time, and an unread count badge (pink, Silkscreen).
     Selected row in --lav-soft.
   - Right chat window: header with the other person's name, "about <Pet>" linking to the pet's profile, and
     for shelters their verified badge. Messages oldest→newest; mine right-aligned on --lav-soft, theirs
     left-aligned on --paper, both with the 2px ink border and small radius, time under each, date dividers
     ("Today", "Yesterday", "24 Sept"). "Load older messages" at the top when hasMore.
   - Compose bar: textarea (Enter sends, Shift+Enter new line), character counter near the limit, "Send"
     primary button, "SENDING..." while waiting. Keep the draft and show the error if sending fails.
3. Polling: while a thread is open, fetch new messages every 5s and mark read; refresh the contact list and
   unread count every 15s. Pause when the tab is hidden (visibilitychange). Stay scrolled to the bottom on new
   messages only if the user was already at the bottom; otherwise show a "New messages ↓" pill.
4. Entry points (all call startThread, then open /messages/:threadId):
   - Pet profile window: "Message the shelter" secondary button (adopters; logged out → login first).
   - My applications detail (approved): "Message the shelter".
   - Shelter inbox reading pane: "Message <applicant>".
5. Empty states: no threads → "No messages yet. Open a pet's profile to message its shelter."; new thread with
   no messages → "Say hello to <Name>.". Loading/error: same LOADING window / ErrorDialog + Retry.
6. Taskbar: "Messages (n)" task button with the unread count for everyone logged in (updates every 15s).
7. No emoji picker (CLAUDE.md). Works at 400px. Append this prompt to docs/claude-prompts.md as
   "Session 14 — Messaging".

Done when: an adopter opens Mochi's profile → "Message the shelter" → sends "Is Mochi good with other cats?";
logging in as Mochi's shelter (see README "Demo accounts", password PawShare@123) in an incognito window shows
Messages (1), the thread with the unread badge and the message; the shelter's reply appears in the adopter's
open chat within ~5 seconds without refreshing. Lint and build pass. Commit: "feat(messages): messenger".
```

---


## Session 15 — Post-adoption check-ins

```text
Run `git checkout main && git pull`, then create `feature/checkins` from main.

Read CLAUDE.md, the "Check-ins — /api/checkins" section of README.md, and server/models + controllers for
CheckIn (read only). Check: status values, how isOverdue is worked out, the exact health-update fields and
allowed values (condition great/good/fair/poor, weightKg, eatingWell, vetVisit, notes, photos), the ad-hoc
POST /, and what GET /received and GET /animal/:animalId return. Tell me what you found first.

Seed (the only server/ change allowed): extend server/scripts/seedDemo.js with a demo adopter
adopter@demo.pawshare.test / PawShare@123 (name "Ananya Rao") who adopted Rocky from Stray Hearts Trust
5 weeks ago (approved application), with check-ins: 1 week = completed (condition good, 31.5 kg, eating well,
note), 1 month = overdue, 3 months = pending. Keep the seed idempotent. List the account in README "Demo accounts".

Build:
1. Adopter: /checkins (RequireAuth, adopters). Window "PET_DIARY.EXE" (mint title bar).
   - One section per adopted/fostered pet: face/photo, name, "Adopted from <Shelter> on 20 Aug".
   - A timeline row of the scheduled check-ins as three stops (1 WEEK · 1 MONTH · 3 MONTHS) joined by a
     dashed line: completed = mint with a tick, due soon (≤7 days) = sun "Due in 3 days", overdue = pink
     "Overdue by 4 days", later = paper "Due 20 Nov". Text on every state, not colour only.
   - "Fill in check-in" button on the next due/overdue one; "Log an update" button for an ad-hoc update anytime.
   - Below: HEALTH.LOG history, newest first: date, condition Pill, weight, eating well, vet visit, notes,
     photos (64px circles). If there are 2+ weights, a small SVG line chart of weight over time
     (axis labels in Silkscreen 10px, points marked, colours from tokens).
2. Check-in form (Modal window "CHECKUP.EXE — ROCKY"): condition as 4 Chips (Great / Good / Fair / Poor),
   weight (kg, optional), eating well (yes/no), vet visit since last time (yes/no), notes (textarea),
   up to 3 photos using the upload helper from session 13 (URL fallback). Validate against the server's rules,
   "SAVING..." while sending, then mint "Check-in saved. Thank you!" and refresh the diary.
3. Shelter: /shelter/checkins (RequireAuth, shelters). Window "CHECKINS.EXE" (sun title bar): one row per
   adopted/fostered animal with adopter name, last update date and condition, next due, and an Overdue pink
   Pill if any. Status chips: All / Overdue / Due this week / Up to date. Clicking a row opens the same
   HEALTH.LOG history (read-only) plus a "Message <adopter>" button (startThread from session 14).
4. Taskbar: adopters get "Check-ins (n due)" when something is due within 7 days or overdue; shelters get
   "Check-ins (n overdue)". My applications (approved) detail gets a "Open pet diary" link.
5. Empty states: adopter with no adoptions → "No pets to check in on yet."; shelter → "No adopted pets yet.".
   Loading/error as elsewhere. Works at 400px (timeline stacks vertically). Append this prompt to
   docs/claude-prompts.md as "Session 15 — Post-adoption check-ins".

Done when: after `npm run seed:demo`, logging in as adopter@demo.pawshare.test shows Bruno with 1 week done,
1 month overdue, 3 months pending; filling in the overdue check-in (condition great, 32 kg) marks it done and
adds it to the log with a 2-point weight chart; logging in as the Stray Hearts Trust shelter shows Bruno with
the new update and no overdue pill. Lint and build pass.
Commits: "feat(server): demo adopter with past adoption" and "feat(checkins): pet diary and shelter view".
```

Follow-up after the findings (Rocky is foster-only and on the map, so he can't be "adopted" without changing
the map):

```text
Option D: don't touch Rocky or the other 9 pets. In the seed, add a 10th animal "Bruno" — dog, Labrador mix,
3 years, male, large, vaccinated + neutered, temperament Gentle / Good with kids, listingType adoption,
owned by Stray Hearts Trust (HSR Layout), with 2 health records (vaccination, neuter). No photo (cartoon face).
Seed an adoption application from adopter@demo.pawshare.test (Ananya Rao) approved 35 days ago, so Bruno is
`adopted` (not on the map, correctly) and the server's 3 check-ins exist: 1 week completed (condition good,
31.5 kg, eating well, note "Settling in, loves the balcony"), 1 month overdue, 3 months pending.
Create the check-ins the same way the server does on approval (reuse its helper if there is one) so the dates
and labels match real ones. Keep the seed idempotent, and make sure re-running it never resets Bruno to available.
Update the "Done when" checks to use Bruno instead of Rocky. Everything else as planned; go ahead.
```

---

## Session 16 — Shelter profiles

```text
Run `git checkout main && git pull`, then create `feature/shelter-profiles` from main.

Read CLAUDE.md and README.md sections "Reviews", "Users" and "Verification & admin", plus server/models +
controllers for User, Review and verification (read only). Check: what GET /api/users/:id returns for a shelter
(stats, rating, ratingCount, isVerified, about/website?), GET /:id/reviews paging, GET /:id/adoption-history,
review rules (one per approved application, who can edit/delete, rating 1–5, comment length), and the
verification request fields and statuses. Tell me what you found first.

Seed (the only server/ change allowed): Ananya (adopter@demo.pawshare.test) leaves a 5-star review of Stray
Hearts Trust for Bruno's adoption: "Bruno settled in within a week. The team called twice to check on us."
Keep the seed idempotent and don't overwrite the review if it already exists.

Build:
1. /shelters/:id (public). Window "<SHELTER NAME>.INFO" styled as a Properties dialog with Silkscreen tabs:
   GENERAL · PETS · REVIEWS · HISTORY (tabs are real buttons with aria-selected; #reviews etc. deep-link a tab).
   - Header on every tab: shelter name, area, a VERIFIED mint badge (or "Not verified yet" in sun), the rating as
     5 pixel-art SVG stars in --sun with a 2px ink outline (half stars allowed) + "4.8 (12 reviews)".
   - GENERAL: about text, website (link), member since, stats as small label/value pairs (animals listed,
     adoptions, fosters, active listings). Contact is not shown publicly; "Message this shelter" button instead
     (adopters only; opens messenger with { recipientId }).
   - PETS: the shelter's available animals as the same PetCard grid; clicking opens the profile window.
   - REVIEWS: newest first, paged ("Load more"). Each: reviewer first name, stars, date, comment, which pet.
   - HISTORY: GET adoption-history as a list: pet face/photo, name, Adopted/Fostered, month + year.
2. Link every shelter name in the app to /shelters/:id: pet profile window, list cards, My applications,
   messenger header, check-in diary.
3. Leave a review: in My applications (approved) and the pet diary, if the adopter hasn't reviewed that
   application yet, show "Rate <Shelter>". Modal window "REVIEW.EXE": 5 clickable/keyboard-accessible stars
   (arrow keys change the rating, radio-group semantics), comment textarea with the server's max length,
   "Send review". Existing review → "Edit your review" / "Delete" (confirm inside the window). Refresh the
   rating after saving.
4. Shelter verification: /shelter/verification (shelters). Window "VERIFY.EXE". Shows the current status from
   GET /verification/me (unsubmitted / pending / approved / rejected with the admin's note). If unsubmitted or
   rejected: form with registration number, about, website (optional), document (optional; upload with the
   session 13 helper, or a URL). Pending → "Waiting for an admin to review your request." Approved → mint
   "Your shelter is verified." The existing "not verified" sun notes elsewhere link here.
5. Taskbar for shelters: "My profile" task button → their own /shelters/:id.
6. Works at 400px (tabs scroll sideways inside their own row if needed). Append this prompt to
   docs/claude-prompts.md as "Session 16 — Shelter profiles".

Done when: /shelters/<Stray Hearts id> shows VERIFIED, 5 stars "5.0 (1 review)", Ananya's review, and Bruno in
HISTORY; clicking "Stray Hearts Trust" in Rocky's profile opens it; an adopter with an approved application can
leave, edit and delete a review and the rating updates; a new shelter account can submit a verification request
and then sees "Waiting for an admin". Lint and build pass.
Commits: "feat(server): demo review" and "feat(shelters): profiles, reviews, verification requests".
```

Follow-up after the findings (the public profile had no about text or website, and no adoptions/fosters split):

```text
Go with 2: add `about` and `website` (from verification) to the public GET /api/users/:id for shelters only,
plus a server test for it. Don't expose registrationNumber, documentUrl or the admin note. Mention the change
in the PR description so Poojitha sees it.

Since the about text is now public, give the 4 demo shelters realistic about texts in the seed (2 sentences
each, e.g. "Whisker Walk Rescue takes in street cats from Indiranagar and nearby areas. Every cat is vaccinated
and spayed or neutered before adoption."), no website. Keep the seed idempotent, updating the about text
if it still has the old "Demo shelter in..." wording.

Stats on GENERAL: "Available now" (availableCount), "Adopted" and "Fostered" (split from adoption history by
type). Drop "animals listed".

Everything else as you proposed: client-side owner filter for PETS (fine for the demo), first names for
reviewers, match pets to reviews through the application id, find my own review by paging, add shelterId in
toPet. Go ahead.
```

---

## Session 18 — Admin control panel

```text
Run `git checkout main && git pull`, then create `feature/admin` from main.

Read CLAUDE.md, README.md "Verification & admin", "Reviews" and "Animals", and server/routes + controllers for
admin, verification, reviews and animals (read only). Check: GET /api/admin/shelters (status filter values,
what fields come back, paging), PATCH /api/admin/shelters/:id/verification (decision approve|reject, note rules,
can an approved shelter be revoked, what happens to its listings), which review and animal endpoints an admin
may use (delete any review, edit any listing, list animals of any status), and whether there's any way to list
all reviews. Tell me what you found first.

Seed (the only server/ change allowed): add two shelters, keep idempotent, never overwrite their verification
status once it has changed:
- "Paws & Whiskers Foundation", JP Nagar [77.5857, 12.9063], shelter.jpnagar@demo.pawshare.test / PawShare@123,
  verification PENDING (registration "KA-BLR-TR-2024-0417", about 2 sentences, website https://example.org/pww).
- "Little Paws Home", Whitefield, shelter.whitefield@demo.pawshare.test / PawShare@123, verification UNSUBMITTED.
Add both to README "Demo accounts" together with the admin line "create your own with npm run create-admin".

Build /admin (RequireAuth, role admin only; others see an ERROR window "ADMINS ONLY."):
1. Window "CONTROL_PANEL.EXE" (lavender title bar) opening on an icon grid in the classic Control Panel style,
   each icon a small hand-drawn SVG in our style with a Silkscreen label and a count badge:
   "Shelter verification (2 waiting)", "Reviews", "Listings". Clicking opens that section in the same window
   with a "← Control Panel" back button; sections deep-link as /admin/verification, /admin/reviews, /admin/listings.
   A summary row at the top: Waiting for verification · Verified shelters · Listings · Placed pets.
2. Verification: status Chips (Pending / Approved / Rejected / Not submitted). Two panes like the shelter inbox:
   list of shelters (name, area, submitted date, status Pill) + detail pane with registration number, about,
   website link, document link (opens in a new tab), submitted date, previous admin note.
   - Pending: "Approve" (primary) and "Reject"; the note is optional for approve and REQUIRED for reject
     ("Tell the shelter what to fix."). Confirm inside the pane.
   - Approved: "Revoke verification" with a required note, if the server supports it; explain the effect
     shown by the server (e.g. can't publish new listings).
   After a decision, refresh the list and counts.
3. Reviews: pick a shelter (dropdown of approved shelters), list its reviews (reviewer, stars, date, comment,
   pet) with "Remove review" (confirm inside the row, shows the server's message on failure). The shelter's
   rating refreshes after removal.
4. Listings: all animals, any status, with status Chips and a search box (name/breed), shelter name, and
   "Edit" (reuses the session 13 editor, admin allowed) / "Remove" (same client-side guard from session 13:
   blocked while applications are pending).
5. Taskbar for admins: "Control Panel (n)" with the pending-verification count. The admin still sees the map.
6. Empty/loading/error states like the rest of the app. Works at 400px (icon grid wraps, panes stack).
   Append this prompt to docs/claude-prompts.md as "Session 18 — Admin control panel".

Done when: after `npm run seed:demo`, logging in as the admin shows "Shelter verification (2 waiting)" (Paws &
Whiskers pending + the shelter created in session 16 testing, if it exists); approving Paws & Whiskers with a
note makes it VERIFIED on its /shelters page, and logging in as shelter.jpnagar@demo.pawshare.test lets it add a
pet; rejecting another with a note shows that note on the shelter's VERIFY.EXE page and lets it resubmit;
removing a review updates the shelter's rating; a non-admin gets "ADMINS ONLY.". Lint and build pass.
Commits: "feat(server): demo pending shelters" and "feat(admin): control panel".
```

Follow-up after Claude reported what the server does:

```text
Go ahead as described, with these UI rules:
- Pending → Approve / Reject. Approved → Revoke verification. Rejected and Not submitted → read-only
  ("Waiting for the shelter to submit or resubmit."), no buttons, even though the server would allow it.
- Reject and revoke need a note in the UI; approve note optional. Tell the admin that approving without a note
  clears the old note.
- Revoke confirmation text: "Revoke <Shelter>'s verification? They won't be able to add new listings. Their
  current listings stay visible." (matches what the server does).
- Reviews: use your /applications/received trick for pet names. Listings: client-side search is fine.
- Editor back-navigation to /admin/listings when opened from there: yes.
- Whitefield [77.7500, 12.9698] is fine. Update the seed header comment.
Also add to README under Verification & admin: "Rejecting an approved shelter revokes it; existing listings
stay live, new listings are blocked until re-approved."
```

---

## Tips

- If Claude Code starts using Tailwind, a component library or emoji, say "Follow CLAUDE.md, remove that."
- Ask it to take its time on SVG sessions (3 and 4): "Copy the coordinates exactly from the reference; don't
  redraw them."
- Keep this file in the repo too (`docs/claude-prompts.md`) so Poojitha and Vedha can see how the UI was built.
