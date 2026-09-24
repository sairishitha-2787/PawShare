const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, startDB, stopDB, clearDB, signupAs } = require("./setup");

const dog = { name: "Bruno", species: "dog", ageMonths: 24, size: "large", listingType: "both" };

describe("applications", () => {
  let shelter;
  let adopter;
  let adopter2;
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

  const apply = (auth, body = {}) =>
    as(auth).post("/api/applications", {
      animalId,
      type: "adoption",
      message: "We have a big garden",
      answers: { homeType: "house", hasYard: true, hoursAlonePerDay: 3 },
      ...body,
    });

  const animalStatus = async () => (await request(app).get(`/api/animals/${animalId}`)).body.animal.status;

  beforeEach(async () => {
    await clearDB();
    shelter = await signupAs("shelter");
    adopter = await signupAs("adopter");
    adopter2 = await signupAs("adopter");
    animalId = (await as(shelter).post("/api/animals", dog)).body.animal._id;
  });

  it("lets an adopter apply and marks the animal pending", async () => {
    const res = await apply(adopter);
    assert.equal(res.status, 201);
    assert.equal(res.body.application.status, "pending");
    assert.equal(res.body.application.shelter, shelter.user.id);
    assert.equal(res.body.application.answers.homeType, "house");
    assert.equal(await animalStatus(), "pending");
  });

  it("only adopters can apply", async () => {
    assert.equal((await apply(shelter)).status, 403);
    assert.equal((await request(app).post("/api/applications").send({ animalId })).status, 401);
  });

  it("validates input", async () => {
    assert.equal((await apply(adopter, { type: "buy" })).status, 400);
    assert.equal((await apply(adopter, { animalId: undefined })).status, 400);
    assert.equal((await apply(adopter, { animalId: "64b000000000000000000000" })).status, 404);
    assert.equal((await apply(adopter, { answers: { homeType: "castle" } })).status, 400);
  });

  it("rejects a type the animal isn't listed for", async () => {
    await request(app)
      .put(`/api/animals/${animalId}`)
      .set("Authorization", `Bearer ${shelter.token}`)
      .send({ listingType: "adoption" });

    const res = await apply(adopter, { type: "foster" });
    assert.equal(res.status, 400);
  });

  it("blocks duplicate active applications", async () => {
    await apply(adopter);
    assert.equal((await apply(adopter)).status, 409);
  });

  it("shows adopters their own and shelters their received applications", async () => {
    await apply(adopter);
    await apply(adopter2);

    const mine = await as(adopter).get("/api/applications/mine");
    assert.equal(mine.body.applications.length, 1);
    assert.equal(mine.body.applications[0].animal.name, "Bruno");

    const received = await as(shelter).get("/api/applications/received");
    assert.equal(received.body.applications.length, 2);
    assert.ok(received.body.applications[0].applicant.email);

    const otherShelter = await signupAs("shelter");
    const none = await as(otherShelter).get("/api/applications/received");
    assert.equal(none.body.applications.length, 0);
  });

  it("only the applicant, the shelter or an admin can view an application", async () => {
    const id = (await apply(adopter)).body.application._id;

    assert.equal((await as(adopter).get(`/api/applications/${id}`)).status, 200);
    assert.equal((await as(shelter).get(`/api/applications/${id}`)).status, 200);
    assert.equal((await as(adopter2).get(`/api/applications/${id}`)).status, 403);
  });

  it("approving adopts the animal and rejects the other applicants", async () => {
    const first = (await apply(adopter)).body.application._id;
    const second = (await apply(adopter2)).body.application._id;

    const res = await as(shelter).patch(`/api/applications/${first}/status`, {
      status: "approved",
      note: "Welcome!",
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.application.status, "approved");
    assert.equal(res.body.application.shelterNote, "Welcome!");
    assert.ok(res.body.application.decidedAt);
    assert.equal(await animalStatus(), "adopted");

    const other = await as(adopter2).get(`/api/applications/${second}`);
    assert.equal(other.body.application.status, "rejected");

    // Adopted animals take no new applications.
    const third = await signupAs("adopter");
    assert.equal((await apply(third)).status, 409);
  });

  it("approving a foster application marks the animal fostered", async () => {
    const id = (await apply(adopter, { type: "foster", fosterUntil: "2026-12-31" })).body
      .application._id;
    await as(shelter).patch(`/api/applications/${id}/status`, { status: "approved" });
    assert.equal(await animalStatus(), "fostered");
  });

  it("rejecting the last pending application frees the animal", async () => {
    const id = (await apply(adopter)).body.application._id;
    const res = await as(shelter).patch(`/api/applications/${id}/status`, { status: "rejected" });
    assert.equal(res.body.application.status, "rejected");
    assert.equal(await animalStatus(), "available");
  });

  it("can't decide an application twice or for someone else's animal", async () => {
    const id = (await apply(adopter)).body.application._id;
    const otherShelter = await signupAs("shelter");

    assert.equal(
      (await as(otherShelter).patch(`/api/applications/${id}/status`, { status: "approved" })).status,
      403
    );
    assert.equal(
      (await as(shelter).patch(`/api/applications/${id}/status`, { status: "maybe" })).status,
      400
    );
    await as(shelter).patch(`/api/applications/${id}/status`, { status: "rejected" });
    assert.equal(
      (await as(shelter).patch(`/api/applications/${id}/status`, { status: "approved" })).status,
      409
    );
  });

  it("withdrawing frees the animal only when nobody else is waiting", async () => {
    const first = (await apply(adopter)).body.application._id;
    const second = (await apply(adopter2)).body.application._id;

    assert.equal((await as(adopter2).patch(`/api/applications/${first}/withdraw`)).status, 403);

    const res = await as(adopter).patch(`/api/applications/${first}/withdraw`);
    assert.equal(res.body.application.status, "withdrawn");
    assert.equal(await animalStatus(), "pending");

    await as(adopter2).patch(`/api/applications/${second}/withdraw`);
    assert.equal(await animalStatus(), "available");

    // Withdrawn twice → conflict; re-applying afterwards is allowed.
    assert.equal((await as(adopter).patch(`/api/applications/${first}/withdraw`)).status, 409);
    assert.equal((await apply(adopter)).status, 201);
  });
});
