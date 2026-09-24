const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, startDB, stopDB, clearDB, signupAs } = require("./setup");
const CheckIn = require("../models/CheckIn");
const { getDueReminders, markReminded } = require("../services/checkInReminders");

const DAY_MS = 24 * 60 * 60 * 1000;
const dog = { name: "Bruno", species: "dog", ageMonths: 24, size: "large", listingType: "both" };

describe("check-ins", () => {
  let shelter;
  let adopter;
  let stranger;
  let animalId;

  before(startDB);
  after(stopDB);

  const as = (auth) => ({
    get: (url) => request(app).get(url).set("Authorization", `Bearer ${auth.token}`),
    post: (url, body) =>
      request(app).post(url).set("Authorization", `Bearer ${auth.token}`).send(body),
    patch: (url, body) =>
      request(app).patch(url).set("Authorization", `Bearer ${auth.token}`).send(body),
  });

  // Adopter applies and the shelter approves; returns the application.
  const adopt = async (body = {}) => {
    const app1 = (
      await as(adopter).post("/api/applications", { animalId, type: "adoption", ...body })
    ).body.application;
    await as(shelter).patch(`/api/applications/${app1._id}/status`, { status: "approved" });
    return app1;
  };

  beforeEach(async () => {
    await clearDB();
    shelter = await signupAs("shelter");
    adopter = await signupAs("adopter");
    stranger = await signupAs("adopter");
    animalId = (await as(shelter).post("/api/animals", dog)).body.animal._id;
  });

  it("schedules 1 week / 1 month / 3 month check-ins on approval", async () => {
    await adopt();

    const res = await as(adopter).get("/api/checkins/mine");
    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.checkIns.map((c) => c.label),
      ["1 week", "1 month", "3 months"]
    );
    const first = res.body.checkIns[0];
    assert.equal(first.status, "pending");
    assert.equal(first.isOverdue, false);
    assert.equal(first.animal.name, "Bruno");

    const days = (new Date(first.dueDate) - Date.now()) / DAY_MS;
    assert.ok(days > 6.9 && days <= 7, `first check-in due in ~7 days, got ${days}`);
  });

  it("does not schedule check-ins for rejected applications", async () => {
    const id = (await as(adopter).post("/api/applications", { animalId, type: "adoption" })).body
      .application._id;
    await as(shelter).patch(`/api/applications/${id}/status`, { status: "rejected" });
    assert.equal((await as(adopter).get("/api/checkins/mine")).body.checkIns.length, 0);
  });

  it("skips foster check-ins after the foster end date", async () => {
    const until = new Date(Date.now() + 40 * DAY_MS).toISOString();
    await adopt({ type: "foster", fosterUntil: until });

    const labels = (await as(adopter).get("/api/checkins/mine")).body.checkIns.map((c) => c.label);
    assert.deepEqual(labels, ["1 week", "1 month"]);
  });

  it("completes a check-in with a health update", async () => {
    await adopt();
    const [first] = (await as(adopter).get("/api/checkins/mine")).body.checkIns;

    const bad = await as(adopter).post(`/api/checkins/${first._id}/complete`, { notes: "fine" });
    assert.equal(bad.status, 400); // condition is required

    const res = await as(adopter).post(`/api/checkins/${first._id}/complete`, {
      condition: "great",
      weightKg: 28.5,
      eatingWell: true,
      notes: "Settled in, loves walks",
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.checkIn.status, "completed");
    assert.equal(res.body.checkIn.healthUpdate.weightKg, 28.5);
    assert.ok(res.body.checkIn.completedAt);

    const again = await as(adopter).post(`/api/checkins/${first._id}/complete`, {
      condition: "good",
    });
    assert.equal(again.status, 409);
  });

  it("only the adopter can complete their check-in", async () => {
    await adopt();
    const [first] = (await as(adopter).get("/api/checkins/mine")).body.checkIns;

    const res = await as(stranger).post(`/api/checkins/${first._id}/complete`, {
      condition: "good",
    });
    assert.equal(res.status, 403);
  });

  it("filters by status, overdue and due window", async () => {
    await adopt();
    const [first] = (await as(adopter).get("/api/checkins/mine")).body.checkIns;
    await CheckIn.updateOne({ _id: first._id }, { dueDate: new Date(Date.now() - DAY_MS) });

    const overdue = await as(adopter).get("/api/checkins/mine?status=overdue");
    assert.deepEqual(overdue.body.checkIns.map((c) => c.label), ["1 week"]);
    assert.equal(overdue.body.checkIns[0].isOverdue, true);

    const soon = await as(adopter).get("/api/checkins/mine?dueWithin=31");
    assert.deepEqual(soon.body.checkIns.map((c) => c.label), ["1 week", "1 month"]);

    assert.equal((await as(adopter).get("/api/checkins/mine?status=later")).status, 400);
    assert.equal((await as(adopter).get("/api/checkins/mine?dueWithin=soon")).status, 400);
  });

  it("lets an adopter log a health update any time for their animal only", async () => {
    await adopt();

    const res = await as(adopter).post("/api/checkins", {
      animalId,
      condition: "fair",
      vetVisit: true,
      notes: "Mild cough, vet gave medicine",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.checkIn.kind, "adhoc");
    assert.equal(res.body.checkIn.status, "completed");

    const denied = await as(stranger).post("/api/checkins", { animalId, condition: "good" });
    assert.equal(denied.status, 403);
    assert.equal((await as(adopter).post("/api/checkins", { condition: "good" })).status, 400);
  });

  it("shows the shelter check-ins for its animals and the animal's history", async () => {
    await adopt();
    await as(adopter).post("/api/checkins", { animalId, condition: "great" });

    const received = await as(shelter).get("/api/checkins/received");
    assert.equal(received.body.checkIns.length, 4);
    assert.ok(received.body.checkIns[0].adopter.email);

    const otherShelter = await signupAs("shelter");
    assert.equal((await as(otherShelter).get("/api/checkins/received")).body.checkIns.length, 0);

    const history = await as(shelter).get(`/api/checkins/animal/${animalId}`);
    assert.equal(history.body.checkIns.length, 4);
    assert.equal((await as(adopter).get(`/api/checkins/animal/${animalId}`)).status, 200);
    assert.equal((await as(stranger).get(`/api/checkins/animal/${animalId}`)).status, 403);
  });

  it("reminder service returns due, un-reminded check-ins once", async () => {
    await adopt();

    assert.equal((await getDueReminders({ withinDays: 1 })).length, 0);

    const due = await getDueReminders({ withinDays: 8 });
    assert.equal(due.length, 1);
    assert.equal(due[0].label, "1 week");
    assert.ok(due[0].adopter.email);
    assert.equal(due[0].animal.name, "Bruno");

    await markReminded(due.map((c) => c._id));
    assert.equal((await getDueReminders({ withinDays: 8 })).length, 0);
  });
});
