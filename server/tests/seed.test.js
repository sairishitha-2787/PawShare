const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, startDB, stopDB, clearDB, signupAs } = require("./setup");
const { seed } = require("../scripts/seed");
const data = require("../scripts/seedData");
const User = require("../models/User");
const Animal = require("../models/Animal");
const CheckIn = require("../models/CheckIn");

const login = async (localPart) =>
  (
    await request(app)
      .post("/api/auth/login")
      .send({ email: `${localPart}@${data.SEED_DOMAIN}`, password: data.SEED_PASSWORD })
  ).body;

describe("seed script", () => {
  let realUser;
  let summary;

  before(async () => {
    await startDB();
    await clearDB();
    realUser = await signupAs("adopter"); // non-seed data that must survive re-seeding
    summary = await seed();
  });
  after(stopDB);

  it("creates shelters, an admin, an adopter and 15-20 animals", async () => {
    assert.equal(summary.shelters, 4);
    assert.equal(summary.admins, 1);
    assert.ok(summary.animals >= 15 && summary.animals <= 20);

    const shelters = await User.find({ role: "shelter", email: /seed\.pawshare\.test$/ });
    assert.equal(shelters.length, 4);
    assert.ok(shelters.every((s) => s.isVerified && s.verification.status === "approved"));
    assert.deepEqual(
      shelters.map((s) => s.location.city).sort(),
      ["Bengaluru", "Chennai", "Hyderabad", "Pune"]
    );
  });

  it("covers every species, age group, size, gender and listing type", async () => {
    const animals = await Animal.find();
    const set = (field) => [...new Set(animals.map((a) => a[field]))].sort();

    for (const species of ["cat", "dog", "rabbit"]) assert.ok(set("species").includes(species));
    assert.deepEqual(set("ageGroup"), ["adult", "baby", "senior", "young"]);
    assert.deepEqual(set("listingType"), ["adoption", "both", "foster"]);
    assert.deepEqual(set("gender"), ["female", "male"]);
    assert.ok(set("size").length >= 3);

    for (const a of animals) {
      assert.ok(a.temperament.length >= 2 && a.temperament.length <= 3, a.name);
      assert.equal(a.healthRecords.length, 1);
      assert.match(a.photos[0].url, /^https:\/\//);
      assert.equal(a.location.coordinates.coordinates.length, 2);
    }
  });

  it("hides adopted animals from default search", async () => {
    const all = await request(app).get("/api/animals?limit=50");
    assert.equal(all.body.total, summary.available);
    assert.ok(all.body.animals.every((a) => a.status === "available"));

    const adopted = await request(app).get("/api/animals?status=adopted");
    assert.equal(adopted.body.total, summary.adopted);
    assert.ok(summary.adopted >= 2);
  });

  it("gives adopted animals a consistent approved application and check-ins", async () => {
    const adopter = await login("adopter");
    const history = await request(app)
      .get(`/api/users/${adopter.user.id}/adoption-history`)
      .set("Authorization", `Bearer ${adopter.token}`);
    assert.equal(history.body.history.length, summary.adopted);
    assert.equal(await CheckIn.countDocuments(), summary.adopted * 3);
  });

  it("finds seeded animals near a city on the map", async () => {
    const res = await request(app).get("/api/animals/nearby?lng=78.4867&lat=17.385&radius=20");
    assert.ok(res.body.count > 0);
    assert.ok(res.body.animals.every((a) => a.location.city === "Hyderabad"));
  });

  it("seed accounts can log in, and the shelter can publish", async () => {
    const shelter = await login("shelter.pune");
    assert.equal(shelter.user.role, "shelter");
    const res = await request(app)
      .post("/api/animals")
      .set("Authorization", `Bearer ${shelter.token}`)
      .send({ name: "Extra", species: "dog", ageMonths: 12, size: "small" });
    assert.equal(res.status, 201);

    assert.equal((await login("admin")).user.role, "admin");
  });

  it("re-running replaces seed data without duplicating or touching real users", async () => {
    const again = await seed();
    assert.deepEqual(again, summary);

    assert.equal(await User.countDocuments({ email: /seed\.pawshare\.test$/ }), 6);
    assert.equal(await Animal.countDocuments(), summary.animals); // "Extra" was removed too
    assert.ok(await User.exists({ _id: realUser.user.id }));
  });
});
