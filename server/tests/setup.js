const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

const app = require("../app");

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
const signupAs = async (role, overrides = {}) => {
  const email = `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ name: `Test ${role}`, email, password: "secret123", role, ...overrides });
  return res.body;
};

module.exports = { app, request, startDB, stopDB, clearDB, signupAs };
