const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, startDB, stopDB, clearDB, signupAs } = require("./setup");

const point = (lng, lat) => ({ type: "Point", coordinates: [lng, lat] });

const bruno = {
  name: "Bruno",
  species: "dog",
  breed: "Labrador",
  ageMonths: 24,
  size: "large",
  temperament: ["Friendly", "kid-safe"],
  listingType: "adoption",
  location: { city: "Hyderabad", coordinates: point(78.4867, 17.385) },
};

const misty = {
  name: "Misty",
  species: "cat",
  breed: "Persian",
  ageMonths: 6,
  size: "small",
  temperament: ["calm"],
  listingType: "foster",
  location: { city: "Mumbai", coordinates: point(72.8777, 19.076) },
};

describe("animals", () => {
  let shelter;
  let adopter;

  before(startDB);
  after(stopDB);

  beforeEach(async () => {
    await clearDB();
    shelter = await signupAs("shelter");
    adopter = await signupAs("adopter");
  });

  const create = (auth, body) =>
    request(app).post("/api/animals").set("Authorization", `Bearer ${auth.token}`).send(body);

  it("lets a shelter create a listing and sets owner + ageGroup", async () => {
    const res = await create(shelter, { ...bruno, owner: adopter.user.id });
    assert.equal(res.status, 201);
    assert.equal(res.body.animal.owner, shelter.user.id); // owner from body is ignored
    assert.equal(res.body.animal.ageGroup, "young");
    assert.deepEqual(res.body.animal.temperament, ["friendly", "kid-safe"]);
  });

  it("blocks adopters and anonymous users from creating listings", async () => {
    assert.equal((await create(adopter, bruno)).status, 403);
    assert.equal((await request(app).post("/api/animals").send(bruno)).status, 401);
  });

  it("returns 400 with messages for invalid listings", async () => {
    const res = await create(shelter, { name: "X", species: "dragon" });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.length >= 1);
  });

  it("filters by species, size, age, city, temperament and listing type", async () => {
    await create(shelter, bruno);
    await create(shelter, misty);

    const names = async (qs) => {
      const res = await request(app).get(`/api/animals?${qs}`);
      assert.equal(res.status, 200);
      return res.body.animals.map((a) => a.name).sort();
    };

    assert.deepEqual(await names(""), ["Bruno", "Misty"]);
    assert.deepEqual(await names("species=cat"), ["Misty"]);
    assert.deepEqual(await names("species=dog,cat&size=large"), ["Bruno"]);
    assert.deepEqual(await names("maxAge=12"), ["Misty"]);
    assert.deepEqual(await names("ageGroup=young"), ["Bruno"]);
    assert.deepEqual(await names("city=hyderabad"), ["Bruno"]);
    assert.deepEqual(await names("breed=lab"), ["Bruno"]);
    assert.deepEqual(await names("temperament=friendly,kid-safe"), ["Bruno"]);
    assert.deepEqual(await names("listingType=foster"), ["Misty"]);
    assert.deepEqual(await names("q=persian"), ["Misty"]);
    assert.deepEqual(await names("breed=.*"), []); // regex chars are escaped
  });

  it("paginates results", async () => {
    await create(shelter, bruno);
    await create(shelter, misty);

    const res = await request(app).get("/api/animals?limit=1&page=2");
    assert.equal(res.body.animals.length, 1);
    assert.equal(res.body.total, 2);
    assert.equal(res.body.totalPages, 2);
  });

  it("rejects non-numeric age filters", async () => {
    const res = await request(app).get("/api/animals?minAge=abc");
    assert.equal(res.status, 400);
  });

  it("hides adopted animals unless status is requested", async () => {
    const { body } = await create(shelter, bruno);
    await request(app)
      .put(`/api/animals/${body.animal._id}`)
      .set("Authorization", `Bearer ${shelter.token}`)
      .send({ status: "adopted" });

    assert.equal((await request(app).get("/api/animals")).body.total, 0);
    assert.equal((await request(app).get("/api/animals?status=adopted")).body.total, 1);
  });

  it("finds nearby animals within a radius", async () => {
    await create(shelter, bruno);
    await create(shelter, misty);

    // ~5 km from Bruno in Hyderabad; Mumbai is ~620 km away
    const near = await request(app).get("/api/animals/nearby?lng=78.45&lat=17.40&radius=10");
    assert.equal(near.status, 200);
    assert.deepEqual(near.body.animals.map((a) => a.name), ["Bruno"]);

    const far = await request(app).get("/api/animals/nearby?lng=78.45&lat=17.40&radius=1000");
    assert.deepEqual(far.body.animals.map((a) => a.name), ["Bruno", "Misty"]);

    const bad = await request(app).get("/api/animals/nearby?lng=500&lat=17");
    assert.equal(bad.status, 400);
  });

  it("gets one animal with owner info, 404s on missing, 400s on bad id", async () => {
    const { body } = await create(shelter, bruno);

    const res = await request(app).get(`/api/animals/${body.animal._id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.animal.owner.name, "Test shelter");
    assert.equal(res.body.animal.owner.email, undefined);

    assert.equal((await request(app).get("/api/animals/64b000000000000000000000")).status, 404);
    assert.equal((await request(app).get("/api/animals/not-an-id")).status, 400);
  });

  it("only the owner (or admin) can edit or delete a listing", async () => {
    const other = await signupAs("shelter");
    const { body } = await create(shelter, bruno);
    const url = `/api/animals/${body.animal._id}`;

    const forbidden = await request(app)
      .put(url)
      .set("Authorization", `Bearer ${other.token}`)
      .send({ name: "Stolen" });
    assert.equal(forbidden.status, 403);

    const updated = await request(app)
      .put(url)
      .set("Authorization", `Bearer ${shelter.token}`)
      .send({ ageMonths: 120 });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.animal.ageGroup, "senior");

    assert.equal(
      (await request(app).delete(url).set("Authorization", `Bearer ${other.token}`)).status,
      403
    );
    assert.equal(
      (await request(app).delete(url).set("Authorization", `Bearer ${shelter.token}`)).status,
      200
    );
    assert.equal((await request(app).get(url)).status, 404);
  });

  it("lists a shelter's own animals", async () => {
    const other = await signupAs("shelter");
    await create(shelter, bruno);
    await create(other, misty);

    const res = await request(app)
      .get("/api/animals/mine")
      .set("Authorization", `Bearer ${shelter.token}`);
    assert.deepEqual(res.body.animals.map((a) => a.name), ["Bruno"]);
  });

  it("returns 404 JSON for unknown routes", async () => {
    const res = await request(app).get("/api/nope");
    assert.equal(res.status, 404);
    assert.ok(res.body.message);
  });
});
