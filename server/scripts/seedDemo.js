// Demo data for the frontend neighborhood map: one verified shelter per area and the 9 pets
// from client/src/data/mockPets.js.
// Usage (from the server folder):  npm run seed:demo
//
// Also one demo adopter (Ananya Rao) who adopted a 10th animal, Bruno, from Stray Hearts Trust 35 days
// ago, so the check-in screens have data: 1 week done, 1 month overdue, 3 months still to come.
//
// Safe to re-run: shelters are matched by email and animals by (shelter, name), then updated in place,
// so ids stay the same (favorites and /adopt/:id links keep working) and nothing else is deleted.
// Bruno's approved application and its check-ins are only created once; later runs leave them (and any
// updates logged since) alone, and Bruno always stays "adopted".
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Animal = require("../models/Animal");
const Application = require("../models/Application");
const CheckIn = require("../models/CheckIn");

const DEMO_DOMAIN = "demo.pawshare.test";
const DEMO_PASSWORD = "PawShare@123";

// The map fills its lots in listing order (oldest first), so the demo animals get fixed, early
// createdAt times in mockPets order. That keeps each pet in its reference house on every re-run.
const LISTED_FROM = new Date("2026-01-01T00:00:00Z");

// Photos are served by the client from client/public/demo-pets/<id>.jpg (id = lowercase name).
const PHOTO_BASE = `${process.env.CLIENT_URL || "http://localhost:5173"}/demo-pets`;

const SHELTERS = [
  { key: "koramangala", name: "Happy Tails Shelter", city: "Koramangala", coords: [77.6245, 12.9352] },
  { key: "indiranagar", name: "Whisker Walk Rescue", city: "Indiranagar", coords: [77.6408, 12.9784] },
  { key: "hsr", name: "Stray Hearts Trust", city: "HSR Layout", coords: [77.6387, 12.9121] },
  { key: "bengaluru", name: "Bengaluru Paws Collective", city: "Bengaluru", coords: [77.5946, 12.9716] },
];

// Same order as mockPets. The API has no hamster species, so Tofu and Peanut are "other"; the client
// reads "hamster" in the breed and shows them as hamsters.
const ANIMALS = [
  {
    shelter: "koramangala", name: "Biscuit", species: "dog", breed: "Golden Retriever", ageMonths: 24,
    gender: "male", size: "medium", vaccinated: true, listingType: "adoption", status: "available",
    temperament: ["Loves fetch", "Good with kids", "House-trained"],
    description: "Biscuit follows his nose everywhere and will sit for a single treat. He does best with a family that walks him twice a day.",
  },
  {
    shelter: "indiranagar", name: "Mochi", species: "cat", breed: "Indie (domestic short-hair)", ageMonths: 8,
    gender: "female", size: "small", vaccinated: false, listingType: "foster", status: "available",
    temperament: ["Lap cat", "Shy at first", "Indoor only"],
    description: "Mochi was found in a parking lot during the monsoon. Her foster family is moving out soon, so she needs a new home quickly.",
  },
  {
    shelter: "koramangala", name: "Clover", species: "rabbit", breed: "Dutch rabbit", ageMonths: 12,
    gender: "female", size: "small", vaccinated: false, listingType: "adoption", status: "available",
    temperament: ["Litter-trained", "Quiet", "Likes coriander"],
    description: "Clover spends her mornings doing laps and her afternoons asleep in a cardboard box. Apartment-friendly.",
  },
  {
    shelter: "hsr", name: "Pepper", species: "dog", breed: "Labrador mix", ageMonths: 48,
    gender: "female", size: "medium", vaccinated: true, listingType: "adoption", status: "pending",
    temperament: ["Calm", "Leash-trained", "Spayed"],
    description: "Pepper already has an application in review. You can still favorite her in case it falls through.",
  },
  {
    shelter: "indiranagar", name: "Luna", species: "cat", breed: "Grey British Shorthair mix", ageMonths: 4,
    gender: "female", size: "small", vaccinated: true, listingType: "adoption", status: "available",
    temperament: ["Playful", "Curious", "Indoor only"],
    description: "Luna is a grey kitten who investigates every bag and box that comes into the house, then naps on top of it.",
  },
  {
    shelter: "hsr", name: "Rocky", species: "dog", breed: "Golden Retriever", ageMonths: 108,
    gender: "male", size: "large", vaccinated: true, listingType: "foster", status: "available",
    temperament: ["Senior", "Arthritis meds", "Very gentle"],
    description: "Rocky was surrendered when his family moved abroad. He needs a ground-floor foster while the shelter is full.",
  },
  {
    shelter: "koramangala", name: "Tofu", species: "other", breed: "Dwarf hamster", ageMonths: 6,
    gender: "male", size: "small", vaccinated: false, listingType: "adoption", status: "pending",
    temperament: ["Playful", "Chews cables", "Neutered"],
    description: "Tofu is tiny and busy. Keep cables away from his cage, because he will find them.",
  },
  {
    shelter: "indiranagar", name: "Sushi", species: "cat", breed: "Ginger Persian mix", ageMonths: 24,
    gender: "female", size: "small", vaccinated: true, listingType: "adoption", status: "available",
    temperament: ["Chatty", "Good with cats", "Spayed"],
    description: "Sushi has a long ginger coat that needs brushing a few times a week. She shares her space well with other cats.",
  },
  {
    shelter: "hsr", name: "Peanut", species: "other", breed: "Syrian hamster", ageMonths: 12,
    gender: "male", size: "small", vaccinated: false, listingType: "adoption", status: "available",
    temperament: ["Night owl", "Lives solo", "Cheek stuffer"],
    description: "Peanut is a Syrian hamster, so he lives on his own. He wakes up in the evening and runs laps on his wheel.",
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const ADOPTER = { email: `adopter@${DEMO_DOMAIN}`, name: "Ananya Rao", city: "HSR Layout", coords: [77.6387, 12.9121] };

// Not in ANIMALS: Bruno is adopted, so he isn't on the map and has no photo (the client draws his face).
const BRUNO = {
  shelter: "hsr", name: "Bruno", species: "dog", breed: "Labrador mix", ageMonths: 36,
  gender: "male", size: "large", vaccinated: true, neutered: true, listingType: "adoption",
  temperament: ["Gentle", "Good with kids"],
  description: "Bruno is a big, soft Labrador mix who leans on your legs for pats. Calm indoors and good with children.",
};
const ADOPTED_DAYS_AGO = 35;

const locationFor = ({ city, coords }) => ({
  city,
  state: "Karnataka",
  country: "India",
  coordinates: { type: "Point", coordinates: coords },
});

const upsertShelter = async (s, password) => {
  const email = `shelter.${s.key}@${DEMO_DOMAIN}`;
  const user = (await User.findOne({ email })) || new User({ email });
  user.set({
    name: s.name,
    password,
    role: "shelter",
    location: locationFor(s),
    isVerified: true,
    verification: {
      status: "approved",
      registrationNumber: `DEMO-${s.key.toUpperCase()}`,
      about: `Demo shelter in ${s.city} for the PawShare neighborhood map.`,
      submittedAt: LISTED_FROM,
      reviewedAt: LISTED_FROM,
    },
  });
  await user.save();
  return user;
};

const seedDemo = async ({ log = () => {} } = {}) => {
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const shelters = {};
  for (const s of SHELTERS) {
    shelters[s.key] = await upsertShelter(s, password);
  }
  log(`Shelters: ${SHELTERS.map((s) => `${s.name} (${s.city})`).join(", ")}`);

  const animals = [];
  for (const [i, { shelter: key, ...fields }] of ANIMALS.entries()) {
    const owner = shelters[key];
    const shelter = SHELTERS.find((s) => s.key === key);
    const animal =
      (await Animal.findOne({ owner: owner._id, name: fields.name })) || new Animal({ owner: owner._id });
    const listedAt = new Date(LISTED_FROM.getTime() + i * 60 * 1000);
    animal.set({
      ...fields,
      photos: [{ url: `${PHOTO_BASE}/${fields.name.toLowerCase()}.jpg` }],
      location: locationFor(shelter),
      createdAt: listedAt,
      updatedAt: new Date(),
    });
    await animal.save({ timestamps: false });
    animals.push(animal);
  }
  log(`Animals: ${animals.map((a) => `${a.name} (${a.status})`).join(", ")}`);

  const { adopter, bruno } = await seedAdoption(shelters, password, animals.length);
  log(`Adopter: ${adopter.name} (${adopter.email}) adopted ${bruno.name}`);

  return { shelters, animals, adopter, bruno };
};

// Ananya adopts Bruno: an approved application from 35 days ago with the server's own check-in schedule.
const seedAdoption = async (shelters, password, listingIndex) => {
  const adopter = (await User.findOne({ email: ADOPTER.email })) || new User({ email: ADOPTER.email });
  adopter.set({ name: ADOPTER.name, password, role: "adopter", location: locationFor(ADOPTER) });
  await adopter.save();

  const { shelter: key, ...fields } = BRUNO;
  const owner = shelters[key];
  const decidedAt = new Date(Date.now() - ADOPTED_DAYS_AGO * DAY_MS);
  const bruno = (await Animal.findOne({ owner: owner._id, name: fields.name })) || new Animal({ owner: owner._id });
  if (bruno.isNew) {
    bruno.healthRecords = [
      { title: "Vaccination (DHPPi + rabies)", date: new Date(decidedAt.getTime() - 40 * DAY_MS), vetName: "Dr. Meera Iyer", notes: "Annual boosters done." },
      { title: "Neutered", date: new Date(decidedAt.getTime() - 25 * DAY_MS), vetName: "Dr. Meera Iyer", notes: "Healed well, stitches out after 10 days." },
    ];
  }
  bruno.set({
    ...fields,
    status: "adopted", // never back to available, even on re-runs
    photos: [],
    location: locationFor(SHELTERS.find((s) => s.key === key)),
    createdAt: new Date(LISTED_FROM.getTime() + listingIndex * 60 * 1000),
    updatedAt: new Date(),
  });
  await bruno.save({ timestamps: false });

  let application = await Application.findOne({ animal: bruno._id, applicant: adopter._id, status: "approved" });
  if (!application) {
    application = new Application({
      animal: bruno._id,
      applicant: adopter._id,
      shelter: owner._id,
      type: "adoption",
      status: "approved",
      message: "We have a ground-floor flat with a balcony and I work from home most days.",
      answers: { homeType: "apartment", hasYard: false, hasChildren: false, otherPets: "None", hoursAlonePerDay: 3, experience: "Grew up with two Labradors." },
      shelterNote: "Lovely match. Bruno is all yours!",
      decidedAt,
      createdAt: new Date(decidedAt.getTime() - 4 * DAY_MS),
      updatedAt: decidedAt,
    });
    await application.save({ timestamps: false });
  }

  // The same helper the server calls on approval, dated from the approval, so labels and due dates match.
  if (!(await CheckIn.exists({ application: application._id }))) {
    const [firstWeek] = await CheckIn.scheduleFor(application, application.decidedAt);
    firstWeek.set({
      status: "completed",
      completedAt: new Date(firstWeek.dueDate.getTime() + DAY_MS),
      healthUpdate: { condition: "good", weightKg: 31.5, eatingWell: true, vetVisit: false, notes: "Settling in, loves the balcony" },
    });
    await firstWeek.save();
  }

  return { adopter, bruno };
};

module.exports = seedDemo;
module.exports.DEMO_DOMAIN = DEMO_DOMAIN;
module.exports.DEMO_PASSWORD = DEMO_PASSWORD;

if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      await seedDemo({ log: console.log });
      console.log(`Done. Shelter logins: shelter.<area>@${DEMO_DOMAIN} / ${DEMO_PASSWORD}`);
      console.log(`Adopter login: ${ADOPTER.email} / ${DEMO_PASSWORD}`);
    } catch (err) {
      console.error("Demo seed failed:", err.message);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  })();
}
