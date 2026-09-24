const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Creates an admin account, or promotes an existing user with that email to admin.
// Admins can't sign up through the API, so this is the only way to make one.
const createAdmin = async ({ name, email, password }) => {
  if (!email || !password) throw new Error("email and password are required");
  if (String(password).length < 6) throw new Error("password must be at least 6 characters");

  const normalizedEmail = String(email).toLowerCase().trim();
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    existing.role = "admin";
    existing.password = hashedPassword;
    await existing.save();
    return { user: existing, created: false };
  }

  const user = await User.create({
    name: name || "Admin",
    email: normalizedEmail,
    password: hashedPassword,
    role: "admin",
  });
  return { user, created: true };
};

module.exports = createAdmin;
