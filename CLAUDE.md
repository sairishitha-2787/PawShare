# PawShare — notes for Claude Code

PawShare is a MERN pet adoption and foster care platform (college PBL project).
This file covers the **frontend** (`client/`). Owner: Sai Rishitha.
Backend (`server/`, Express + MongoDB) is owned by Poojitha. Don't change files in `server/` unless the prompt says so.

## Source of truth for the UI

`design/neighborhood-reference.html` is the approved mockup. Open it in a browser before building any UI.
When this file and your own taste disagree, **the reference wins**. Port its SVG geometry, colors, sizes,
borders, shadows and copy exactly. Don't "improve" or restyle it.

## Stack

- React 18 + Vite, JavaScript (no TypeScript), React Router
- Plain CSS with CSS variables (`src/styles/tokens.css`, `src/styles/global.css`) + one `.css` file per component.
  **No Tailwind, no UI libraries (MUI, Chakra, shadcn), no icon packs.** All shapes are hand-written SVG.
- Data fetching: `fetch` wrapped in `src/api/client.js`. Base URL from `import.meta.env.VITE_API_URL`.
- State: React state + context (`AuthContext`, `FavoritesContext`). No Redux.
- Auth: the token is in localStorage `pawshare-token`; `api/client.js` sends it as a Bearer header and clears it on a 401.
  Wrap pages that need a login in `<RequireAuth>`.

## Design tokens (copy exactly)

```css
--cream:#FDF6E9; --paper:#FFFDF8; --lav:#B8A6E0; --lav-soft:#E7DEFA;
--pink:#FF9EBB; --pink-soft:#FFE1EA; --mint:#A8D8B9; --mint-soft:#DDF2E4;
--sun:#FFD873; --ink:#3A3355; --ink-soft:#6D6588; --grid:#EADCF2; --hot:#E9668E;
--pixel:"Silkscreen","Courier New",monospace;
--body:"Fredoka","Trebuchet MS",system-ui,sans-serif;
```

- Fonts: Google Fonts `Silkscreen` (400, 700) and `Fredoka` (400, 500, 600), linked in `index.html`.
- Silkscreen = title bars, buttons, chips, labels, pet names. Fredoka = everything people read (descriptions, forms).
- Page background: 28px lavender grid over a mint → lilac → butter vertical gradient (see reference `body`).

## Visual rules

- Every content block is a **Window**: 2px `--ink` border, 14px radius, hard offset shadow `5px 5px 0 var(--ink)`,
  a title bar (Silkscreen 13px, uppercase file-style name like `MOCHI.PROFILE`) with three dots (sun, mint, pink).
- Buttons and chips: 2px ink border, `2px 2px 0` shadow that disappears on `:active` (pressed look).
- Status colors (used as pin ring + pill): available `#A8D8B9`, urgent `#FF9EBB`, pending `#FFD873`.
- House type = species: doghouse (coral roof `#F4877F`) for dogs, cat tower (blue ear-roof `#8FB8F0`) for cats,
  birdhouse for birds (bird: lavender scalloped roof, hanging from a branch; `design/birds/birdhouse-reference.jpeg`),
  hutch (yellow roof `#FFD873`) for rabbits, guinea pigs and hamsters.
- One joke only: the empty-results state is an `ERROR` window with an `OK` button. No other gags.
- No emoji in UI. The only glyphs allowed are ♥ / ♡ on the favorite button.
- Visible focus ring: `outline:3px solid var(--hot)`. Respect `prefers-reduced-motion` (turn off pin bob/hover lift).
- Exception: houses show focus as a hot-pink name-plate outline (as in the reference), not the global outline.
- Must work at 400px wide: the map scrolls sideways inside its own container; the page never scrolls sideways.

## Folder layout

```
client/src/
  api/          client.js, animals.js, auth.js, applications.js, uploads.js (Cloudinary photo + document upload), threads.js, checkins.js,
                users.js (public profiles, reviews list, adoption history, updateMe), reviews.js, verification.js,
                admin.js (shelter verification decisions, every animal / every review of a shelter, paged through)
                health.js (GET /health, for the boot screen)
  components/
    ui/         Window, Chip, SegToggle, Button, Pill, ErrorDialog, Modal, Taskbar, Field, ChoiceField, LoadingWindow
    shell/      ShellLayout (the layout route around every page: the page, then the one shared taskbar), StartMenu
    os/         BootScreen (BOOT.EXE: once per tab while GET /health wakes the API, 2.2s–9s; BootContext replays it)
                PawTrails (one dog + one cat trail walking behind every window: fixed z-index -1 layer, mounted in
                ShellLayout; off during BOOT.EXE, with reduced motion, or when the setting is off; paused while the tab is hidden)
    desktop/    DesktopIcons (the home page's hand-drawn icons, same 48×48 style as admin/PanelIcons)
    auth/       RequireAuth, FormError
    pets/       PetFace, House, Pin, PetCard, ProfileWindow
    map/        Neighborhood, SceneBackdrop, Legend
    apply/      ApplyWizard, Answers (read-only answers, shared), ApplicationDetail
    inbox/      ReadingPane (the shelter's view of one application, with Approve / Reject)
    shelter/    PetForm (add/edit listing) + TagField, HealthLogField, PhotoField, PetPreview, ListingFoot (Edit / Remove with
                the pending-application guard, shared by MY_PETS/ and the admin's Listings)
    admin/      PanelIcons, VerificationSection, ReviewsSection, ListingsSection (the CONTROL_PANEL.EXE sections)
    search/     FindPetsWindow (FIND_PETS.EXE), ActiveFilters (removable chips under the toolbar), NearMe (toggle, area
                picker, radius chips), NearbyShelters (NEARBY_SHELTERS/)
    messages/   ContactList, ChatPane, MessageButton (starts a thread, then opens /messages/:threadId)
    checkins/   Timeline (1 WEEK · 1 MONTH · 3 MONTHS stops), HealthLog + WeightChart, CheckInForm (CHECKUP.EXE modal)
    shelters/   ShelterLink (a shelter name → /shelters/:id), Stars (pixel-art stars, RatingSummary), StarInput (radio group),
                ReviewWindow (REVIEW.EXE modal), RateShelter ("Rate <Shelter>" / your review, under an approved application)
  context/      AuthContext.jsx, FavoritesContext.jsx, UnreadContext.jsx (unread message count, polled every 15s),
                CheckInsContext.jsx (the taskbar's check-ins count, polled every minute; useCheckInsTask),
                AdminContext.jsx (admins: shelters waiting for verification, polled every minute; useAdminTask),
                TaskCountsContext.jsx (the shell's numbers: pending applications + the three above; usePublishTaskCount)
                BootContext.jsx (BOOT.EXE: replay(), booting, and STARTUP.CFG's two settings: "Show boot screen" in localStorage
                `pawshare-boot`, "Walking paws in background" in `pawshare-paws`)
  hooks/        useApplicationList.js (shared), useMyApplications.js, useReceivedApplications.js, usePolling.js, useLoad.js,
                useAnimalSearch.js (the Adopt page's results, 50 at a time), useNearMe.js (browser location or area picker)
  data/         mockPets.js
  pages/        DesktopPage.jsx (the "/" desktop), AdoptPage.jsx, ApplyPage.jsx, ApplicationsPage.jsx, ShelterInboxPage.jsx, MyPetsPage.jsx, PetEditorPage.jsx,
                MessagesPage.jsx, CheckInsPage.jsx (PET_DIARY.EXE), ShelterCheckInsPage.jsx (CHECKINS.EXE), ShelterProfilePage.jsx
                (<NAME>.INFO, tabs picked by the URL hash), VerificationPage.jsx (VERIFY.EXE), AdminPage.jsx (CONTROL_PANEL.EXE,
                /admin/:section), AccountPage.jsx (SETTINGS.EXE), NotFoundPage.jsx (FILE NOT FOUND), LoginPage.jsx,
                SignupPage.jsx, DevKit.jsx (dev builds only)
  utils/        one file per area (pure helpers have a *.test.js next to them, run by `npm test` / Vitest) (search, geo, listing, applications, checkins, messages, shelters, ...); shell.js has the
                Start menu's role pages and petOfTheDay; boot.js has BOOT.EXE's storage helpers and timeline (bootFrame);
                paws.js has the paws setting and the trail geometry (makeTrail, nextEdge)
  styles/       tokens.css, global.css
```

## Routes

Every route sits inside `ShellLayout` (main.jsx), so the taskbar is never part of a page: don't add one.
Pages other than DesktopPage and AdoptPage are `React.lazy`; ShellLayout's Suspense shows a LOADING... window meanwhile.
`/dev/kit` is only registered when `import.meta.env.DEV`. A production build without `VITE_API_URL` shows "API URL NOT CONFIGURED."
instead of any page (dev falls back to localhost:5000). Deploying: `docs/DEPLOY.md`; demo script and reset: `docs/DEMO.md`.

| Path | Page |
|---|---|
| `/` | DesktopPage: role icons, README.TXT, PET_OF_THE_DAY.JPG, the "Welcome back" line |
| `/adopt`, `/adopt/:petId` | AdoptPage (the neighborhood map; the open profile is in the URL). `#list` = Full list, `#favorites` = scroll to FAVORITES/ |
| `/apply/:petId` | ApplyPage |
| `/applications`, `/applications/:id` | ApplicationsPage (adopter) |
| `/shelter/applications`, `/shelter/applications/:id` | ShelterInboxPage (shelter, admin) |
| `/shelter/animals`, `/shelter/animals/new`, `/shelter/animals/:id/edit` | MyPetsPage, PetEditorPage |
| `/messages`, `/messages/:threadId` | MessagesPage |
| `/checkins`, `/shelter/checkins` | CheckInsPage (adopter), ShelterCheckInsPage |
| `/shelters/:id` | ShelterProfilePage (public) |
| `/shelter/verification` | VerificationPage (shelter) |
| `/admin`, `/admin/:section` | AdminPage (admin) |
| `/account` | AccountPage |
| `/login`, `/signup`, `/dev/kit` | LoginPage, SignupPage, DevKit |
| `*` | NotFoundPage |

All but `/`, `/adopt…`, `/shelters/:id`, `/login`, `/signup` and `/dev/kit` are behind RequireAuth. "Back to the neighborhood",
login/signup redirects and "not for your role" redirects go to `/adopt`, not `/`.

The shell's taskbar shows one task per place (the current page is a plain label). Below 520px only start, the current page,
tasks with a count above zero and the clock stay; the Start menu has everything. A page that holds a fresher list than the
shell (the inbox after an approve, say) publishes its count with `usePublishTaskCount('inbox' | 'applications' | 'favorites', n)`;
otherwise the shell refetches applications on each navigation. PUT /users/me replaces `location` whole, so AccountPage
sends it back with country and coordinates kept, then calls `updateUser` so the taskbar name changes at once.

## Pet data shape (frontend)

```js
{ id, name, species: 'dog'|'cat'|'bird'|'bunny'|'guinea'|'hamster', status: 'available'|'urgent'|'pending',
  listingType: 'adoption'|'foster'|'both',
  age, breed, sex, size, shelter, shelterId, area, vax, tags: [], blurb,
  colors: { fur, dark, bg, cheek? }, crest?: boolean, photoUrl?: string, health?: [{ title, date?, vetName?, notes? }] }
```
`house` is derived from species (dog→dog, cat→cat, bird→bird, bunny/guinea/hamster→hutch). Map positions are **not** stored on the pet;
they come from the lot layout in `Neighborhood` (see prompts).
Birds only: `colors.cheek` draws a cheek patch (cockatiel orange, budgie blue spot) and `crest: true` three crest feathers
(cockatoo, cockatiel); a bird without either gets two small head tufts. The API has neither field, and a photo overrides the face.
Hamsters use the guinea cartoon face. The API has no hamster species: they are `other` with "hamster" in the breed
(`mapSpecies` in `api/animals.js`; the listing form's Hamster chip saves it that way).
Listing form state, validation and the API body live in `utils/listing.js`. Photos: `VITE_CLOUDINARY_CLOUD_NAME` +
`VITE_CLOUDINARY_UPLOAD_PRESET` (unsigned); without them the form takes a pasted image URL.
Demo photos live in `client/public/demo-pets/<id>.jpg`; raw source photos go in `PHOTOS/`, which is git-ignored.

Adopt search: every filter lives in the URL query string (`utils/search.js`: parseFilters / toSearch / apiQuery) and is
filtered on the server; the map pages through 9 per street and loads 50 at a time. "Near me" (`?near=<area key>` or
`lng,lat`, `&radius=5|10|25`) uses GET /animals/nearby, which sends no distances (the client computes them in
`utils/geo.js`), has no paging (max 100) and can't take `q`, so the keyword is matched on the client there.
The default order is listing order (API `sort=oldest`), so each pet keeps its house (the demo's 4 birds are on street 2);
the map shows "STREET n OF m", and with an `isDimmed` filter it jumps to the first street with a match (`utils/streets.js`); "Oldest" in FIND_PETS.EXE is `eldest`.
FAVORITES/ still uses an unfiltered load so saved pets show whatever the search.

Modals stack: only the top one answers Escape and traps Tab (REVIEW.EXE opens over <PET>.APP). The server has no
"my review" endpoint, so `findMyReview` pages through the shelter's reviews to find the one for an application.

Admins: `/admin` is CONTROL_PANEL.EXE (icon grid, then Verification / Reviews / Listings sections in the same window).
The server lets an admin approve or reject from any status and never requires a note; the UI is stricter on purpose
(pending → approve/reject, approved → revoke, reject and revoke need a note). Review pet names come from
`/applications/received`, which returns every application for an admin. The listing editor sends an admin back to
`/admin/listings` when it was opened from there (router state `from: 'admin'`).

Messages aren't pushed: the open chat polls every 5s, the contact list and the unread count every 15s, all
paused while the tab is hidden (`usePolling`).

## Working rules

- Small commits, one feature per commit, message style `feat(map): ...`, `fix(ui): ...`.
- After UI work, run the dev server and compare against the reference side by side at 1200px and 400px.
- Run `npm run lint`, `npm test` and `npm run build` before saying a session is done.
