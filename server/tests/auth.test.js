const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, startDB, stopDB, clearDB } = require("./setup");

describe("auth", () => {
  before(startDB);
  after(stopDB);
  beforeEach(clearDB);

  const user = { name: "Asha", email: "Asha@Test.com", password: "secret123" };

  it("signs up and returns a token without the password", async () => {
    const res = await request(app).post("/api/auth/signup").send(user);
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, "asha@test.com");
    assert.equal(res.body.user.role, "adopter");
    assert.equal(res.body.user.password, undefined);
  });

  it("rejects signing up as admin", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...user, role: "admin" });
    assert.equal(res.status, 400);
  });

  it("rejects duplicate email regardless of case", async () => {
    await request(app).post("/api/auth/signup").send(user);
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...user, email: "ASHA@test.com" });
    assert.equal(res.status, 409);
  });

  it("rejects short passwords", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...user, password: "123" });
    assert.equal(res.status, 400);
  });

  it("logs in with correct credentials and rejects wrong ones", async () => {
    await request(app).post("/api/auth/signup").send(user);

    const ok = await request(app)
      .post("/api/auth/login")
      .send({ email: "asha@test.com", password: "secret123" });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);

    const bad = await request(app)
      .post("/api/auth/login")
      .send({ email: "asha@test.com", password: "wrong" });
    assert.equal(bad.status, 401);
  });

  it("GET /me needs a valid token", async () => {
    const { body } = await request(app).post("/api/auth/signup").send(user);

    const noToken = await request(app).get("/api/auth/me");
    assert.equal(noToken.status, 401);

    const badToken = await request(app).get("/api/auth/me").set("Authorization", "Bearer nope");
    assert.equal(badToken.status, 401);

    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${body.token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, "Asha");
  });
});
