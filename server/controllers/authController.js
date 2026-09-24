const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sanitizeUser = require("../utils/sanitizeUser");

// Admins are never created through public signup.
const SIGNUP_ROLES = ["adopter", "shelter"];

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const signup = async (req, res) => {
  const { name, email, password, phone, role, location } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email, and password are required" });
  }

  // bcrypt ignores everything after 72 bytes, so longer passwords are rejected rather than truncated.
  if (typeof password !== "string" || password.length < 6 || Buffer.byteLength(password) > 72) {
    return res.status(400).json({ message: "password must be a string of 6 to 72 characters" });
  }

  if (role && !SIGNUP_ROLES.includes(role)) {
    return res.status(400).json({ message: `role must be one of: ${SIGNUP_ROLES.join(", ")}` });
  }

  const existingUser = await User.findOne({ email: String(email).toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role,
    location,
  });

  res.status(201).json({ token: signToken(user), user: sanitizeUser(user) });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({ token: signToken(user), user: sanitizeUser(user) });
};

const me = async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

module.exports = { signup, login, me };
