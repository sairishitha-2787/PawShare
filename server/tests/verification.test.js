const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, startDB, stopDB, clearDB, signupAs, loginAsAdmin } = require("./setup");
const createAdmin = require("../services/createAdmin");
const User = require("../models/User");

const dog = { name: "Bruno", species: "dog", ageMonths: 24, size: "large" };
const details = {
  registrationNumber: "AWBI/2024/123",
  about: "Rescue shelter in Hyderabad caring for 40 dogs",
  website: "https://example.org",
};

describe("shelter verification", () => {
  let shelter;
  let admin;
  let adopter;

  before(startDB);
  after(stopDB);

  const as = (auth) => ({
    get: (url) => request(app).get(url).set("Authorization", `Bearer ${auth.token}`),
    post: (url, body) =>
      request(app).post(url).set("Authorization", `Bearer ${auth.token}`).send(body),
    patch: (url, body) =>
      request(app).patch(url).set("Authorization", `Bearer ${auth.token}`).send(body),
  });

  const decide = (id, decision, note) =>
    as(admin).patch(`/api/admin/shelters/${id}/verification`, { decision, note });

  beforeEach(async () => {
    await clearDB();
    shelter = await signupAs("shelter", { verified: false });
    adopter = await signupAs("adopter");
    admin = await loginAsAdmin();
  });

  it("new shelters start unverified and can't publish listings", async () => {
    assert.equal(shelter.user.isVerified, false);
    assert.equal(shelter.user.verificationStatus, "unsubmitted");
    assert.equal(adopter.user.verificationStatus, undefined);

    const res = await as(shelter).post("/api/animals", dog);
    assert.equal(res.status, 403);
    assert.equal(res.body.verificationStatus, "unsubmitted");
  });

  it("shelter submits a request, admin approves, shelter can publish", async () => {
    const sent = await as(shelter).post("/api/verification/request", details);
    assert.equal(sent.status, 201);
    assert.equal(sent.body.verification.status, "pending");

    assert.equal((await as(shelter).post("/api/verification/request", details)).status, 409);

    const pending = await as(admin).get("/api/admin/shelters?status=pending");
    assert.equal(pending.body.shelters.length, 1);
    assert.equal(pending.body.shelters[0].verification.registrationNumber, "AWBI/2024/123");
    assert.ok(pending.body.shelters[0].email);

    const approved = await decide(shelter.user.id, "approve", "Documents checked");
    assert.equal(approved.status, 200);
    assert.equal(approved.body.shelter.isVerified, true);
    assert.equal(approved.body.shelter.verification.status, "approved");

    const me = await as(shelter).get("/api/verification/me");
    assert.equal(me.body.isVerified, true);
    assert.equal(me.body.verification.note, "Documents checked");

    assert.equal((await as(shelter).post("/api/animals", dog)).status, 201);
    assert.equal((await as(shelter).post("/api/verification/request", details)).status, 409);

    const profile = await request(app).get(`/api/users/${shelter.user.id}`);
    assert.equal(profile.body.profile.isVerified, true);
  });

  it("rejected shelters can fix their details and resubmit", async () => {
    await as(shelter).post("/api/verification/request", details);
    const rejected = await decide(shelter.user.id, "reject", "Registration number not found");
    assert.equal(rejected.body.shelter.verification.status, "rejected");
    assert.equal((await as(shelter).post("/api/animals", dog)).status, 403);

    const again = await as(shelter).post("/api/verification/request", {
      ...details,
      registrationNumber: "AWBI/2024/124",
    });
    assert.equal(again.status, 201);
    assert.equal(again.body.verification.status, "pending");
  });

  it("revoking verification blocks new listings but keeps old ones editable", async () => {
    await decide(shelter.user.id, "approve");
    const animalId = (await as(shelter).post("/api/animals", dog)).body.animal._id;

    await decide(shelter.user.id, "reject", "Complaints received");
    assert.equal((await as(shelter).post("/api/animals", dog)).status, 403);

    const edit = await request(app)
      .put(`/api/animals/${animalId}`)
      .set("Authorization", `Bearer ${shelter.token}`)
      .send({ status: "adopted" });
    assert.equal(edit.status, 200);
  });

  it("validates requests and decisions", async () => {
    assert.equal((await as(shelter).post("/api/verification/request", { about: "x" })).status, 400);
    assert.equal((await decide(shelter.user.id, "maybe")).status, 400);
    assert.equal((await decide(adopter.user.id, "approve")).status, 404); // not a shelter
    assert.equal((await decide("64b000000000000000000000", "approve")).status, 404);
  });

  it("only admins can review shelters; only shelters can request", async () => {
    assert.equal((await as(shelter).get("/api/admin/shelters")).status, 403);
    assert.equal((await as(adopter).get("/api/admin/shelters")).status, 403);
    assert.equal((await request(app).get("/api/admin/shelters")).status, 401);
    assert.equal((await as(adopter).post("/api/verification/request", details)).status, 403);
  });

  it("shelters can't verify themselves through the profile update", async () => {
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${shelter.token}`)
      .send({ isVerified: true, verification: { status: "approved" } });
    assert.equal(res.body.user.isVerified, false);
    assert.equal(res.body.user.verificationStatus, "unsubmitted");
  });

  it("admins can publish listings without verification", async () => {
    assert.equal((await as(admin).post("/api/animals", dog)).status, 201);
  });

  it("createAdmin creates a new admin or promotes an existing user", async () => {
    const created = await createAdmin({ email: "Boss@PawShare.com", password: "secret123" });
    assert.equal(created.created, true);
    assert.equal(created.user.email, "boss@pawshare.com");
    assert.equal(created.user.role, "admin");

    const promoted = await createAdmin({ email: adopter.user.email, password: "newpass123" });
    assert.equal(promoted.created, false);
    assert.equal((await User.findById(adopter.user.id)).role, "admin");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: adopter.user.email, password: "newpass123" });
    assert.equal(login.body.user.role, "admin");

    await assert.rejects(createAdmin({ email: "x@y.com", password: "123" }));
  });
});
