// Usage (from the server folder):
//   npm run create-admin -- admin@pawshare.com "a-strong-password" "Admin Name"
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const createAdmin = require("../services/createAdmin");

const [email, password, name] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: npm run create-admin -- <email> <password> ["Name"]');
  process.exit(1);
}

(async () => {
  try {
    await connectDB();
    const { user, created } = await createAdmin({ email, password, name });
    console.log(`${created ? "Created" : "Promoted"} admin: ${user.email}`);
  } catch (err) {
    console.error("Could not create admin:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
