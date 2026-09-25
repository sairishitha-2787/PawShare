// Demo data for the frontend neighborhood map: one verified shelter per area and the 9 pets
// from client/src/data/mockPets.js.
// Usage (from the server folder):  npm run seed:demo
//
// Safe to re-run: shelters are matched by email and animals by (shelter, name), then updated in place,
// so ids stay the same (favorites and /adopt/:id links keep working) and nothing else is deleted.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Animal = require("../models/Animal");

const DEMO_DOMAIN = "demo.pawshare.test";
const DEMO_PASSWORD = "PawShare@123";

// The map fills its lots in listing order (oldest first), so the demo animals get fixed, early
// createdAt times in mockPets order. That keeps each pet in its reference house on every re-run.
const LISTED_FROM = new Date("2026-01-01T00:00:00Z");

const SHELTERS = [
  { key: "koramangala", name: "Happy Tails Shelter", city: "Koramangala", coords: [77.6245, 12.9352] },
  { key: "indiranagar", name: "Whisker Walk Rescue", city: "Indiranagar", coords: [77.6408, 12.9784] },
  { key: "hsr", name: "Stray Hearts Trust", city: "HSR Layout", coords: [77.6387, 12.9121] },
  { key: "bengaluru", name: "Bengaluru Paws Collective", city: "Bengaluru", coords: [77.5946, 12.9716] },
];

// Same order as mockPets. The API has no guinea pig species, so Peanut is "other".
const ANIMALS = [
  {
    shelter: "koramangala", name: "Biscuit", species: "dog", breed: "Beagle mix", ageMonths: 24,
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
    shelter: "hsr", name: "Pepper", species: "dog", breed: "Indie", ageMonths: 48,
    gender: "female", size: "medium", vaccinated: true, listingType: "adoption", status: "pending",
    temperament: ["Calm", "Leash-trained", "Spayed"],
    description: "Pepper already has an application in review. You can still favorite her in case it falls through.",
  },
  {
    shelter: "indiranagar", name: "Luna", species: "cat", breed: "Persian mix", ageMonths: 36,
    gender: "female", size: "medium", vaccinated: true, listingType: "adoption", status: "available",
    temperament: ["Needs grooming", "Gentle", "Sleeps a lot"],
    description: "Luna needs brushing three times a week and likes to supervise from the top of the fridge.",
  },
  {
    shelter: "hsr", name: "Rocky", species: "dog", breed: "Labrador", ageMonths: 108,
    gender: "male", size: "large", vaccinated: true, listingType: "foster", status: "available",
    temperament: ["Senior", "Arthritis meds", "Very gentle"],
    description: "Rocky was surrendered when his family moved abroad. He needs a ground-floor foster while the shelter is full.",
  },
  {
    shelter: "koramangala", name: "Tofu", species: "rabbit", breed: "Lionhead", ageMonths: 6,
    gender: "male", size: "small", vaccinated: false, listingType: "adoption", status: "pending",
    temperament: ["Playful", "Chews cables", "Neutered"],
    description: "Tofu is fluffy and busy. Bunny-proof your wires before he visits.",
  },
  {
    shelter: "indiranagar", name: "Sushi", species: "cat", breed: "Calico Indie", ageMonths: 24,
    gender: "female", size: "small", vaccinated: true, listingType: "adoption", status: "available",
    temperament: ["Chatty", "Good with cats", "Spayed"],
    description: "Sushi will tell you about her day, loudly. She shares her space well with other cats.",
  },
  {
    shelter: "hsr", name: "Peanut", species: "other", breed: "Guinea pig (American)", ageMonths: 18,
    gender: "male", size: "small", vaccinated: false, listingType: "adoption", status: "available",
    temperament: ["Squeaks at dinner", "Needs a buddy", "Hay lover"],
    description: "Peanut should go home with another guinea pig, or to a home that already has one.",
  },
];

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
    animal.set({ ...fields, location: locationFor(shelter), createdAt: listedAt, updatedAt: new Date() });
    await animal.save({ timestamps: false });
    animals.push(animal);
  }
  log(`Animals: ${animals.map((a) => `${a.name} (${a.status})`).join(", ")}`);

  return { shelters, animals };
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
    } catch (err) {
      console.error("Demo seed failed:", err.message);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  })();
}
