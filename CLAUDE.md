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
  birdhouse on a pole (lilac roof `#B8A6E0`) for birds, hutch (yellow roof `#FFD873`) for rabbits, guinea pigs and hamsters.
- One joke only: the empty-results state is an `ERROR` window with an `OK` button. No other gags.
- No emoji in UI. The only glyphs allowed are ♥ / ♡ on the favorite button.
- Visible focus ring: `outline:3px solid var(--hot)`. Respect `prefers-reduced-motion` (turn off pin bob/hover lift).
- Exception: houses show focus as a hot-pink name-plate outline (as in the reference), not the global outline.
- Must work at 400px wide: the map scrolls sideways inside its own container; the page never scrolls sideways.

## Folder layout

```
client/src/
  api/          client.js, animals.js, auth.js, applications.js, uploads.js (Cloudinary photo upload)
  components/
    ui/         Window, Chip, SegToggle, Button, Pill, ErrorDialog, Modal, Taskbar, Field, ChoiceField, LoadingWindow
    auth/       RequireAuth, FormError
    pets/       PetFace, House, Pin, PetCard, ProfileWindow
    map/        Neighborhood, SceneBackdrop, Legend
    apply/      ApplyWizard, Answers (read-only answers, shared), ApplicationDetail
    inbox/      ReadingPane (the shelter's view of one application, with Approve / Reject)
    shelter/    PetForm (add/edit listing) + TagField, HealthLogField, PhotoField, PetPreview
  context/      AuthContext.jsx, FavoritesContext.jsx
  hooks/        useApplicationList.js (shared), useMyApplications.js, useReceivedApplications.js
  data/         mockPets.js
  pages/        AdoptPage.jsx, ApplyPage.jsx, ApplicationsPage.jsx, ShelterInboxPage.jsx, MyPetsPage.jsx, PetEditorPage.jsx,
                PlaceholderPage.jsx, LoginPage.jsx, SignupPage.jsx, DevKit.jsx
  styles/       tokens.css, global.css
```

## Pet data shape (frontend)

```js
{ id, name, species: 'dog'|'cat'|'bird'|'bunny'|'guinea'|'hamster', status: 'available'|'urgent'|'pending',
  listingType: 'adoption'|'foster'|'both',
  age, breed, sex, size, shelter, area, vax, tags: [], blurb,
  colors: { fur, dark, bg }, photoUrl?: string, health?: [{ title, date?, vetName?, notes? }] }
```
`house` is derived from species (dog→dog, cat→cat, bird→bird, bunny/guinea/hamster→hutch). Map positions are **not** stored on the pet;
they come from the lot layout in `Neighborhood` (see prompts).
Hamsters use the guinea cartoon face. The API has no hamster species: they are `other` with "hamster" in the breed
(`mapSpecies` in `api/animals.js`; the listing form's Hamster chip saves it that way).
Listing form state, validation and the API body live in `utils/listing.js`. Photos: `VITE_CLOUDINARY_CLOUD_NAME` +
`VITE_CLOUDINARY_UPLOAD_PRESET` (unsigned); without them the form takes a pasted image URL.
Demo photos live in `client/public/demo-pets/<id>.jpg`; raw source photos go in `PHOTOS/`, which is git-ignored.

## Working rules

- Small commits, one feature per commit, message style `feat(map): ...`, `fix(ui): ...`.
- After UI work, run the dev server and compare against the reference side by side at 1200px and 400px.
- Run `npm run lint` and `npm run build` before saying a session is done.
