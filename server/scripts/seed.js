// Fills the database with demo data.
// Usage (from the server folder):  npm run seed
//
// Safe to re-run: it deletes only previous seed data (accounts with the seed email domain and
// everything linked to them), then inserts fresh data. Real users and their data are untouched.
const path = require("path");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Animal = require("../models/Animal");
const Application = require("../models/Application");
const CheckIn = require("../models/CheckIn");
const Thread = require("../models/Thread");
const Message = require("../models/Message");
const Review = require("../models/Review");
const data = require("./seedData");

const DAY_MS = 24 * 60 * 60 * 1000;
const seedEmail = (localPart) => `${localPart}@${data.SEED_DOMAIN}`;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Removes earlier seed data and anything that references a seed account.
const clearSeedData = async () => {
  const seedUsers = await User.find({
    email: new RegExp(`@${escapeRegex(data.SEED_DOMAIN)}$`),
  }).distinct("_id");
  if (seedUsers.length === 0) return 0;

  const seedAnimals = await Animal.find({ owner: { $in: seedUsers } }).distinct("_id");
  const threads = await Thread.find({
    $or: [{ participants: { $in: seedUsers } }, { animal: { $in: seedAnimals } }],
  }).distinct("_id");

  await Promise.all([
    Message.deleteMany({ thread: { $in: threads } }),
    Thread.deleteMany({ _id: { $in: threads } }),
    CheckIn.deleteMany({
      $or: [{ adopter: { $in: seedUsers } }, { shelter: { $in: seedUsers } }, { animal: { $in: seedAnimals } }],
    }),
    Review.deleteMany({ $or: [{ shelter: { $in: seedUsers } }, { reviewer: { $in: seedUsers } }] }),
    Application.deleteMany({
      $or: [{ applicant: { $in: seedUsers } }, { shelter: { $in: seedUsers } }, { animal: { $in: seedAnimals } }],
    }),
  ]);
  await Animal.deleteMany({ _id: { $in: seedAnimals } });
  await User.deleteMany({ _id: { $in: seedUsers } });
  return seedUsers.length;
};

const seed = async ({ log = () => {} } = {}) => {
  const removed = await clearSeedData();
  if (removed) log(`Removed previous seed data (${removed} accounts and their records)`);

  const password = await bcrypt.hash(data.SEED_PASSWORD, 10);
  const now = new Date();

  const adminUser = await User.create({
    name: data.admin.name,
    email: seedEmail(data.admin.localPart),
    password,
    role: "admin",
  });

  const shelterByKey = {};
  for (const s of data.shelters) {
    shelterByKey[s.key] = await User.create({
      name: s.name,
      email: seedEmail(`shelter.${s.key}`),
      password,
      phone: s.phone,
      role: "shelter",
      location: data.locationFor(s.key),
      isVerified: true,
      verification: {
        status: "approved",
        registrationNumber: s.registrationNumber,
        about: s.about,
        website: s.website,
        submittedAt: new Date(now - 30 * DAY_MS),
        reviewedAt: new Date(now - 29 * DAY_MS),
        reviewedBy: adminUser._id,
        note: "Seed data: verified",
      },
    });
  }

  const adopterUser = await User.create({
    name: data.adopter.name,
    email: seedEmail(data.adopter.localPart),
    password,
    phone: data.adopter.phone,
    role: "adopter",
    location: data.locationFor(data.adopter.cityKey),
  });

  const animals = [];
  for (const [i, a] of data.animals.entries()) {
    const animal = await Animal.create({
      name: a.name,
      species: a.species,
      breed: a.breed,
      ageMonths: a.ageMonths,
      gender: a.gender,
      size: a.size,
      color: a.color,
      description: `${a.name} is a ${a.temperament.join(", ")} ${a.breed} looking for a loving home.`,
      photos: [data.photo(a.species, i + 1)],
      healthRecords: [
        {
          title: "Intake health check",
          date: new Date(now - (20 + i) * DAY_MS),
          vetName: "Dr. Placeholder",
          notes: a.health,
        },
      ],
      vaccinated: a.vaccinated,
      neutered: a.neutered,
      temperament: a.temperament,
      listingType: a.listingType,
      status: a.status || "available",
      owner: shelterByKey[a.shelter]._id,
      location: data.locationFor(a.shelter, ...a.offset),
    });
    animals.push([a, animal]);
  }

  // Adopted animals get a real approved application, so profiles, adoption history
  // and check-ins all agree with the animal's status.
  let adoptions = 0;
  for (const [a, animal] of animals) {
    if (a.adoptedBy !== "adopter") continue;
    const decidedAt = new Date(now - 10 * DAY_MS);
    const application = await Application.create({
      animal: animal._id,
      applicant: adopterUser._id,
      shelter: animal.owner,
      type: "adoption",
      status: "approved",
      message: `We'd love to adopt ${a.name}.`,
      answers: { homeType: "apartment", hasYard: false, hasChildren: false, hoursAlonePerDay: 4 },
      shelterNote: "Seed data: approved",
      decidedAt,
    });
    await CheckIn.scheduleFor(application, decidedAt);
    adoptions++;
  }

  const summary = {
    admins: 1,
    shelters: data.shelters.length,
    adopters: 1,
    animals: animals.length,
    available: animals.filter(([, x]) => x.status === "available").length,
    adopted: animals.filter(([, x]) => x.status === "adopted").length,
    adoptions,
  };
  return summary;
};

// Run from the command line.
if (require.main === module) {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
  const mongoose = require("mongoose");
  const connectDB = require("../config/db");

  if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
    console.error("Refusing to seed with NODE_ENV=production. Pass --force if you really mean it.");
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Add it to server/.env first.");
    process.exit(1);
  }

  (async () => {
    try {
      await connectDB();
      // Build the search/geo indexes if missing (createIndexes never drops existing ones).
      await Promise.all([Animal.createIndexes(), User.createIndexes()]);
      const summary = await seed({ log: console.log });

      console.log("\nSeed complete:");
      console.table(summary);
      console.log(`All seed accounts use the password: ${data.SEED_PASSWORD}`);
      console.log(`  admin    ${seedEmail(data.admin.localPart)}`);
      console.log(`  adopter  ${seedEmail(data.adopter.localPart)}`);
      data.shelters.forEach((s) =>
        console.log(`  shelter  ${seedEmail(`shelter.${s.key}`)}  (${data.CITIES[s.key].city})`)
      );
    } catch (err) {
      console.error("Seeding failed:", err.message);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  })();
}

module.exports = { seed, clearSeedData };
