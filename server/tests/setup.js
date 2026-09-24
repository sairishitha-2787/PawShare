const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

const app = require("../app");
const User = require("../models/User");
const createAdmin = require("../services/createAdmin");

let mongo;

const startDB = async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  // Build indexes (text, 2dsphere) before any query relies on them.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
};

const stopDB = async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
};

const clearDB = async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
};

// Signs up a user and returns { token, user }.
// Shelters come back already verified unless { verified: false } is passed.
const signupAs = async (role, { verified = true, ...overrides } = {}) => {
  const email = `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ name: `Test ${role}`, email, password: "secret123", role, ...overrides });

  if (role === "shelter" && verified) {
    await User.updateOne(
      { _id: res.body.user.id },
      { isVerified: true, "verification.status": "approved" }
    );
    res.body.user.isVerified = true;
  }
  return res.body;
};

// Admins can't sign up, so tests create them directly and log in.
const loginAsAdmin = async () => {
  const email = `admin-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  await createAdmin({ name: "Test admin", email, password: "secret123" });
  const res = await request(app).post("/api/auth/login").send({ email, password: "secret123" });
  return res.body;
};

module.exports = { app, request, startDB, stopDB, clearDB, signupAs, loginAsAdmin };
