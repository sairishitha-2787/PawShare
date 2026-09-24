const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, startDB, stopDB, signupAs, loginAsAdmin } = require("./setup");

// Throws malformed input at every endpoint. Any 5xx means unvalidated input reached the database.

const FIELDS = [
  "name", "email", "password", "phone", "role", "location", "species", "breed", "ageMonths",
  "size", "photos", "healthRecords", "temperament", "listingType", "status", "animalId",
  "type", "answers", "fosterUntil", "message", "recipientId", "text", "condition", "weightKg",
  "applicationId", "rating", "comment", "decision", "note", "registrationNumber", "about",
  "website", "documentUrl",
];

const BAD_VALUES = [
  null,
  42,
  true,
  [],
  ["a", "b"],
  {},
  { $ne: null },
  { $gt: "" },
  "x".repeat(5000),
  "not-an-id",
  "64b000000000000000000000",
];

const BAD_BODIES = [
  ...FIELDS.flatMap((field) => BAD_VALUES.map((value) => ({ [field]: value }))),
  { location: { coordinates: { type: "Point", coordinates: [999, 999] } } },
  { location: { coordinates: { coordinates: [78.4, 17.3] } } },
  { location: { coordinates: { type: "Point", coordinates: ["a", "b"] } } },
  { location: { coordinates: { type: "Point", coordinates: [1] } } },
  { location: "Hyderabad" },
];

const BAD_QUERIES = [
  "species[$ne]=dog",
  "species=dog&species=cat",
  "minAge=-1&maxAge=abc",
  "page=-5&limit=100000",
  "lng=abc&lat=1",
  "lng=1&lat=1&radius=-3",
  "q=" + encodeURIComponent("\"unclosed"),
  "status=overdue&dueWithin=-1",
  "before=nope",
  "animal=not-an-id",
  "sort=" + encodeURIComponent("{\"$where\":1}"),
];

describe("robustness: malformed input never causes a server error", () => {
  const ids = {};
  const auth = {};

  before(async () => {
    await startDB();
    auth.shelter = await signupAs("shelter");
    auth.adopter = await signupAs("adopter");
    auth.admin = await loginAsAdmin();

    const bearer = (who) => ({ Authorization: `Bearer ${auth[who].token}` });
    const post = (who, url, body) => request(app).post(url).set(bearer(who)).send(body);
    const patch = (who, url, body) => request(app).patch(url).set(bearer(who)).send(body);

    ids.animal = (
      await post("shelter", "/api/animals", {
        name: "Bruno", species: "dog", ageMonths: 24, size: "large",
      })
    ).body.animal._id;
    ids.application = (
      await post("adopter", "/api/applications", { animalId: ids.animal, type: "adoption" })
    ).body.application._id;
    await patch("shelter", `/api/applications/${ids.application}/status`, { status: "approved" });
    ids.thread = (await post("adopter", "/api/threads", { animalId: ids.animal })).body.thread._id;
    ids.checkIn = (await request(app).get("/api/checkins/mine").set(bearer("adopter"))).body
      .checkIns[0]._id;
    ids.review = (
      await post("adopter", "/api/reviews", { applicationId: ids.application, rating: 5 })
    ).body.review._id;
    ids.shelter = auth.shelter.user.id;
  });

  after(stopDB);

  // [method, path, who]
  const endpoints = () => [
    ["post", "/api/auth/signup", null],
    ["post", "/api/auth/login", null],
    ["get", "/api/animals", null],
    ["get", "/api/animals/nearby", null],
    ["get", `/api/animals/${ids.animal}`, null],
    ["post", "/api/animals", "shelter"],
    ["put", `/api/animals/${ids.animal}`, "shelter"],
    ["post", "/api/applications", "adopter"],
    ["get", "/api/applications/mine", "adopter"],
    ["get", "/api/applications/received", "shelter"],
    ["patch", `/api/applications/${ids.application}/status`, "shelter"],
    ["patch", `/api/applications/${ids.application}/withdraw`, "adopter"],
    ["post", "/api/threads", "adopter"],
    ["get", "/api/threads", "adopter"],
    ["get", `/api/threads/${ids.thread}/messages`, "adopter"],
    ["post", `/api/threads/${ids.thread}/messages`, "adopter"],
    ["get", "/api/checkins/mine", "adopter"],
    ["get", "/api/checkins/received", "shelter"],
    ["post", "/api/checkins", "adopter"],
    ["post", `/api/checkins/${ids.checkIn}/complete`, "adopter"],
    ["post", "/api/reviews", "adopter"],
    ["put", `/api/reviews/${ids.review}`, "adopter"],
    ["get", `/api/users/${ids.shelter}`, null],
    ["get", `/api/users/${ids.shelter}/reviews`, null],
    ["put", "/api/users/me", "adopter"],
    ["put", "/api/users/me", "shelter"],
    ["post", "/api/verification/request", "shelter"],
    ["get", "/api/admin/shelters", "admin"],
    ["patch", `/api/admin/shelters/${ids.shelter}/verification`, "admin"],
  ];

  const send = (method, url, who, body) => {
    let req = request(app)[method](url);
    if (who) req = req.set("Authorization", `Bearer ${auth[who].token}`);
    return method === "get" ? req : req.send(body);
  };

  it("bodies", async () => {
    const failures = [];
    for (const [method, url, who] of endpoints()) {
      if (method === "get") continue;
      for (const body of BAD_BODIES) {
        const res = await send(method, url, who, body);
        if (res.status >= 500) {
          failures.push(`${method.toUpperCase()} ${url} ${JSON.stringify(body).slice(0, 80)} → ${res.status} ${res.body.error || ""}`);
        }
      }
    }
    assert.deepEqual(failures, []);
  });

  it("query strings", async () => {
    const failures = [];
    for (const [method, url, who] of endpoints()) {
      if (method !== "get") continue;
      for (const qs of BAD_QUERIES) {
        const res = await send(method, `${url}?${qs}`, who);
        if (res.status >= 500) failures.push(`GET ${url}?${qs} → ${res.status} ${res.body.error || ""}`);
      }
    }
    assert.deepEqual(failures, []);
  });

  it("raw non-JSON and oversized bodies", async () => {
    const malformed = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{not json");
    assert.equal(malformed.status, 400);

    const huge = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ email: "x".repeat(2_000_000) }));
    assert.ok(huge.status < 500, `oversized body → ${huge.status}`);
  });

  it("rejects nulls, bad emails, bad coordinates and bad URLs with 400", async () => {
    const put = (who, url, body) =>
      request(app).put(url).set("Authorization", `Bearer ${auth[who].token}`).send(body);

    for (const body of [{ status: null }, { listingType: null }, { gender: null }]) {
      assert.equal((await put("shelter", `/api/animals/${ids.animal}`, body)).status, 400);
    }
    const animal = (await request(app).get(`/api/animals/${ids.animal}`)).body.animal;
    assert.ok(animal.status && animal.listingType && animal.gender);

    const signup = (body) =>
      request(app)
        .post("/api/auth/signup")
        .send({ name: "N", email: `n${Math.random()}@t.com`, password: "secret123", ...body });
    assert.equal((await signup({ role: null })).status, 400);
    assert.equal((await signup({ email: "not-an-email" })).status, 400);
    assert.equal((await signup({ password: 123456 })).status, 400);
    assert.equal((await signup({ password: "x".repeat(73) })).status, 400);

    const badPoints = [[999, 999], [1], ["a", "b"]];
    for (const coordinates of badPoints) {
      const res = await put("adopter", "/api/users/me", {
        location: { coordinates: { type: "Point", coordinates } },
      });
      assert.equal(res.status, 400, `coordinates ${JSON.stringify(coordinates)}`);
    }

    // "type" is optional and defaults to Point.
    const ok = await put("adopter", "/api/users/me", {
      location: { city: "Hyderabad", coordinates: { coordinates: [78.48, 17.38] } },
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.user.location.coordinates.type, "Point");

    const badPhoto = await put("shelter", `/api/animals/${ids.animal}`, {
      photos: [{ url: "javascript:alert(1)" }],
    });
    assert.equal(badPhoto.status, 400);
  });

  it("operator objects in ids don't match arbitrary documents", async () => {
    const other = await signupAs("adopter");
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${other.token}`)
      .send({ applicationId: { $ne: null }, rating: 5 });
    assert.equal(res.status, 400);

    const apply = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${other.token}`)
      .send({ animalId: { $ne: null }, type: "adoption" });
    assert.equal(apply.status, 400);
  });
});
