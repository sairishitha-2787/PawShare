const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { app, request, startDB, stopDB, clearDB, signupAs } = require("./setup");

const dog = { name: "Bruno", species: "dog", ageMonths: 24, size: "large" };

describe("messaging", () => {
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

  const startAboutDog = () => as(adopter).post("/api/threads", { animalId });
  const send = (auth, threadId, text) =>
    as(auth).post(`/api/threads/${threadId}/messages`, { text });

  beforeEach(async () => {
    await clearDB();
    shelter = await signupAs("shelter");
    adopter = await signupAs("adopter");
    stranger = await signupAs("adopter");
    animalId = (await as(shelter).post("/api/animals", dog)).body.animal._id;
  });

  it("starts a thread with the animal's shelter and reuses it", async () => {
    const first = await startAboutDog();
    assert.equal(first.status, 201);
    const names = first.body.thread.participants.map((p) => p.name).sort();
    assert.deepEqual(names, ["Test adopter", "Test shelter"]);
    assert.equal(first.body.thread.animal.name, "Bruno");

    const again = await startAboutDog();
    assert.equal(again.status, 200);
    assert.equal(again.body.thread._id, first.body.thread._id);

    // The shelter opening the same chat from its side gets the same thread.
    const fromShelter = await as(shelter).post("/api/threads", {
      recipientId: adopter.user.id,
      animalId,
    });
    assert.equal(fromShelter.body.thread._id, first.body.thread._id);
  });

  it("validates who you can message", async () => {
    assert.equal((await as(adopter).post("/api/threads", {})).status, 400);
    assert.equal(
      (await as(adopter).post("/api/threads", { recipientId: adopter.user.id })).status,
      400
    );
    assert.equal(
      (await as(adopter).post("/api/threads", { recipientId: "64b000000000000000000000" })).status,
      404
    );
    assert.equal(
      (await as(adopter).post("/api/threads", { animalId: "64b000000000000000000000" })).status,
      404
    );
    assert.equal((await request(app).post("/api/threads").send({ animalId })).status, 401);
  });

  it("sends messages and returns them oldest-first", async () => {
    const threadId = (await startAboutDog()).body.thread._id;

    assert.equal((await send(adopter, threadId, "Hi! Is Bruno good with cats?")).status, 201);
    await send(shelter, threadId, "Yes, very gentle.");
    await send(adopter, threadId, "Great, applying now");

    const res = await as(shelter).get(`/api/threads/${threadId}/messages`);
    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.messages.map((m) => m.text),
      ["Hi! Is Bruno good with cats?", "Yes, very gentle.", "Great, applying now"]
    );
    assert.equal(res.body.hasMore, false);
  });

  it("rejects empty messages", async () => {
    const threadId = (await startAboutDog()).body.thread._id;
    assert.equal((await send(adopter, threadId, "   ")).status, 400);
    assert.equal((await send(adopter, threadId, undefined)).status, 400);
  });

  it("keeps outsiders out of a conversation", async () => {
    const threadId = (await startAboutDog()).body.thread._id;
    await send(adopter, threadId, "private");

    assert.equal((await as(stranger).get(`/api/threads/${threadId}/messages`)).status, 403);
    assert.equal((await send(stranger, threadId, "hi")).status, 403);
    assert.equal((await as(stranger).patch(`/api/threads/${threadId}/read`)).status, 403);
    assert.equal((await as(stranger).get("/api/threads")).body.threads.length, 0);
    assert.equal(
      (await as(adopter).get("/api/threads/64b000000000000000000000/messages")).status,
      404
    );
  });

  it("tracks unread counts and marks messages read", async () => {
    const threadId = (await startAboutDog()).body.thread._id;
    await send(adopter, threadId, "one");
    await send(adopter, threadId, "two");

    // The sender's own messages never count as unread for them.
    assert.equal((await as(adopter).get("/api/threads/unread-count")).body.count, 0);
    assert.equal((await as(shelter).get("/api/threads/unread-count")).body.count, 2);

    const list = await as(shelter).get("/api/threads");
    assert.equal(list.body.threads[0].unreadCount, 2);
    assert.equal(list.body.threads[0].otherParticipant.name, "Test adopter");
    assert.equal(list.body.threads[0].lastMessage.text, "two");

    const read = await as(shelter).patch(`/api/threads/${threadId}/read`);
    assert.equal(read.body.marked, 2);
    assert.equal((await as(shelter).get("/api/threads/unread-count")).body.count, 0);
  });

  it("lists the most recently active thread first", async () => {
    const other = await signupAs("shelter");
    const aboutDog = (await startAboutDog()).body.thread._id;
    const general = (await as(adopter).post("/api/threads", { recipientId: other.user.id })).body
      .thread._id;

    await send(adopter, general, "hello");
    await send(adopter, aboutDog, "newest");

    const res = await as(adopter).get("/api/threads");
    assert.deepEqual(
      res.body.threads.map((t) => t._id),
      [aboutDog, general]
    );
  });

  it("pages back through older messages", async () => {
    const threadId = (await startAboutDog()).body.thread._id;
    for (const text of ["m1", "m2", "m3", "m4", "m5"]) {
      await send(adopter, threadId, text);
    }

    const latest = await as(adopter).get(`/api/threads/${threadId}/messages?limit=2`);
    assert.deepEqual(latest.body.messages.map((m) => m.text), ["m4", "m5"]);
    assert.equal(latest.body.hasMore, true);

    const before = latest.body.messages[0]._id;
    const older = await as(adopter).get(
      `/api/threads/${threadId}/messages?limit=2&before=${before}`
    );
    assert.deepEqual(older.body.messages.map((m) => m.text), ["m2", "m3"]);

    assert.equal(
      (await as(adopter).get(`/api/threads/${threadId}/messages?before=nope`)).status,
      400
    );
  });
});
