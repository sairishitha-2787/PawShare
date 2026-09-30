require("dotenv").config();
const mongoose = require("mongoose");

// Load all models so Mongoose knows about them before we query
require("./models/User");
require("./models/Animal");
require("./models/Application");
require("./models/CheckIn");

const { getDueReminders, markReminded } = require("./services/checkInReminders");
const { sendCheckInReminder } = require("./services/emailService");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const dueReminders = await getDueReminders({ withinDays: 30 });
  console.log(`Found ${dueReminders.length} reminder(s) due`);

  const sentIds = [];

  for (const reminder of dueReminders) {
    try {
      const adopterEmail = reminder.adopter?.email;
      const adopterName = reminder.adopter?.name || "there";
      const animalName = reminder.animal?.name || "your pet";

      if (!adopterEmail) {
        console.log(`Skipping reminder ${reminder._id} — no adopter email found`);
        continue;
      }

      await sendCheckInReminder(adopterEmail, adopterName, `${animalName} — ${reminder.label}`);
      console.log(`Sent reminder to ${adopterEmail}`);
      sentIds.push(reminder._id);
    } catch (err) {
      console.error(`Failed to send for reminder ${reminder._id}:`, err.message);
    }
  }

  if (sentIds.length > 0) {
    await markReminded(sentIds);
    console.log(`Marked ${sentIds.length} reminder(s) as sent`);
  }

  await mongoose.disconnect();
  console.log("Done");
}

run();