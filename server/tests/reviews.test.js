const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, startDB, stopDB, clearDB, signupAs } = require("./setup");
const User = require("../models/User");

const pet = (name) => ({ name, species: "dog", ageMonths: 24, size: "medium" });

describe("reviews, profiles and adoption history", () => {
  let shelter;
  let adopter;
  let adopter2;

  before(startDB);
  after(stopDB);

  const as = (auth) => ({
    get: (url) => request(app).get(url).set("Authorization", `Bearer ${auth.token}`),
    post: (url, body) =>
      request(app).post(url).set("Authorization", `Bearer ${auth.token}`).send(body),
    put: (url, body) =>
      request(app).put(url).set("Authorization", `Bearer ${auth.token}`).send(body),
    patch: (url, body) =>
      request(app).patch(url).set("Authorization", `Bearer ${auth.token}`).send(body),
    delete: (url) => request(app).delete(url).set("Authorization", `Bearer ${auth.token}`),
  });

  // Lists an animal, has `who` apply, and approves (unless approve=false). Returns the application id.
  const adopt = async (who, name = "Bruno", approve = true) => {
    const animalId = (await as(shelter).post("/api/animals", pet(name))).body.animal._id;
    const id = (await as(who).post("/api/applications", { animalId, type: "adoption" })).body
      .application._id;
    if (approve) await as(shelter).patch(`/api/applications/${id}/status`, { status: "approved" });
    return id;
  };

  const review = (who, applicationId, rating, comment) =>
    as(who).post("/api/reviews", { applicationId, rating, comment });

  const profile = async () => (await request(app).get(`/api/users/${shelter.user.id}`)).body.profile;

  beforeEach(async () => {
    await clearDB();
    shelter = await signupAs("shelter");
    adopter = await signupAs("adopter");
    adopter2 = await signupAs("adopter");
  });

  it("lets an adopter review a shelter after an approved adoption", async () => {
    const appId = await adopt(adopter);
    const res = await review(adopter, appId, 5, "Lovely people");
    assert.equal(res.status, 201);
    assert.equal(res.body.review.shelter, shelter.user.id);

    const p = await profile();
    assert.equal(p.rating, 5);
    assert.equal(p.ratingCount, 1);
  });

  it("averages ratings across adoptions and rounds to one decimal", async () => {
    await review(adopter, await adopt(adopter, "A"), 5);
    await review(adopter2, await adopt(adopter2, "B"), 4);
    await review(adopter, await adopt(adopter, "C"), 4);

    const p = await profile();
    assert.equal(p.rating, 4.3);
    assert.equal(p.ratingCount, 3);
  });

  it("blocks reviews without an approved adoption, by others, or twice", async () => {
    const pending = await adopt(adopter, "Pending", false);
    assert.equal((await review(adopter, pending, 5)).status, 400);

    const approved = await adopt(adopter);
    assert.equal((await review(adopter2, approved, 1)).status, 403);
    assert.equal((await review(shelter, approved, 5)).status, 403); // shelters can't review
    assert.equal((await review(adopter, approved, 6)).status, 400);
    assert.equal((await review(adopter, approved, 3.5)).status, 400);
    assert.equal((await review(adopter, undefined, 5)).status, 400);

    assert.equal((await review(adopter, approved, 4)).status, 201);
    assert.equal((await review(adopter, approved, 5)).status, 409);
  });

  it("updates and deletes reviews and keeps the average in sync", async () => {
    const id = (await review(adopter, await adopt(adopter), 2)).body.review._id;

    assert.equal((await as(adopter2).put(`/api/reviews/${id}`, { rating: 1 })).status, 403);

    const updated = await as(adopter).put(`/api/reviews/${id}`, { rating: 4, comment: "Better" });
    assert.equal(updated.status, 200);
    assert.equal((await profile()).rating, 4);

    assert.equal((await as(adopter2).delete(`/api/reviews/${id}`)).status, 403);
    assert.equal((await as(adopter).delete(`/api/reviews/${id}`)).status, 200);
    const p = await profile();
    assert.equal(p.rating, 0);
    assert.equal(p.ratingCount, 0);
  });

  it("lists a shelter's reviews publicly with reviewer names", async () => {
    await review(adopter, await adopt(adopter, "A"), 5, "Great");
    await review(adopter2, await adopt(adopter2, "B"), 3, "Okay");

    const res = await request(app).get(`/api/users/${shelter.user.id}/reviews?limit=1`);
    assert.equal(res.status, 200);
    assert.equal(res.body.reviews.length, 1);
    assert.equal(res.body.reviews[0].comment, "Okay"); // newest first
    assert.equal(res.body.reviews[0].reviewer.name, "Test adopter");
    assert.equal(res.body.total, 2);
    assert.equal(res.body.rating, 4);
  });

  it("shows a public shelter profile without contact details", async () => {
    await adopt(adopter, "Placed");
    await as(shelter).post("/api/animals", pet("Waiting"));

    const p = await profile();
    assert.equal(p.name, "Test shelter");
    assert.equal(p.role, "shelter");
    assert.equal(p.email, undefined);
    assert.equal(p.phone, undefined);
    assert.deepEqual(p.stats, { availableCount: 1, placedCount: 1 });

    assert.equal((await request(app).get("/api/users/64b000000000000000000000")).status, 404);
  });

  it("shows a shelter's about text and website but not its verification details", async () => {
    // The test shelter is already approved, so set what its earlier request would have stored.
    await User.updateOne(
      { _id: shelter.user.id },
      {
        "verification.registrationNumber": "KA-123",
        "verification.about": "We rescue street dogs.",
        "verification.website": "https://example.org",
        "verification.documentUrl": "https://example.org/cert.pdf",
        "verification.note": "Checked by phone",
      }
    );

    const p = await profile();
    assert.equal(p.about, "We rescue street dogs.");
    assert.equal(p.website, "https://example.org");
    const text = JSON.stringify(p);
    for (const hidden of ["KA-123", "cert.pdf", "Checked by phone", "registrationNumber", "documentUrl"]) {
      assert.ok(!text.includes(hidden), `profile leaks ${hidden}`);
    }
    assert.equal(p.verification, undefined);

    // Adopters get neither field.
    const a = (await request(app).get(`/api/users/${adopter.user.id}`)).body.profile;
    assert.equal(a.about, undefined);
    assert.equal(a.website, undefined);
  });

  it("lets users update their own profile but not their role", async () => {
    const res = await as(adopter).put("/api/users/me", {
      name: "Asha R",
      phone: "9999999999",
      location: { city: "Hyderabad" },
      role: "admin",
      isVerified: true,
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, "Asha R");
    assert.equal(res.body.user.location.city, "Hyderabad");
    assert.equal(res.body.user.role, "adopter");
    assert.equal(res.body.user.isVerified, false);

    assert.equal((await request(app).put("/api/users/me").send({ name: "x" })).status, 401);
  });

  it("shows a shelter's placements publicly and an adopter's history privately", async () => {
    const reviewedApp = await adopt(adopter, "A");
    await adopt(adopter, "B");
    await review(adopter, reviewedApp, 5);

    const shelterHistory = await request(app).get(`/api/users/${shelter.user.id}/adoption-history`);
    assert.equal(shelterHistory.status, 200);
    assert.equal(shelterHistory.body.history.length, 2);
    assert.equal(shelterHistory.body.history[0].applicant, undefined); // adopter not exposed

    const url = `/api/users/${adopter.user.id}/adoption-history`;
    const own = await as(adopter).get(url);
    assert.equal(own.status, 200);
    assert.deepEqual(
      own.body.history.map((h) => [h.animal.name, h.reviewed]).sort(),
      [["A", true], ["B", false]]
    );

    assert.equal((await request(app).get(url)).status, 403);
    assert.equal((await as(adopter2).get(url)).status, 403);
  });
});
