const express = require("express");
const { createClient } = require("redis");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const redis = createClient({ url: REDIS_URL });
redis.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await redis.connect();
  console.log("✅ Connected to Redis");
})();

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", redis: redis.isOpen ? "connected" : "down" });
});

// Create a new task
app.post("/tasks", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing `text` in body" });

  try {
    const id = await redis.incr("nextTaskId");
    const key = `task:${id}`;
    await redis.hSet(key, { id, text });
    await redis.sAdd("tasks", id.toString());
    res.status(201).json({ id, text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create task" });
  }
});

// List all tasks
app.get("/tasks", async (req, res) => {
  try {
    const ids = await redis.sMembers("tasks");
    const pipeline = redis.multi();
    ids.forEach((id) => pipeline.hGetAll(`task:${id}`));
    const raw = await pipeline.exec();
    const tasks = raw.map((t) => ({ id: t.id, text: t.text }));
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch tasks" });
  }
});

// Get single task by ID
app.get("/tasks/:id", async (req, res) => {
  try {
    const key = `task:${req.params.id}`;
    const exists = await redis.exists(key);
    if (!exists) return res.status(404).json({ error: "Not found" });
    const data = await redis.hGetAll(key);
    res.json({ id: data.id, text: data.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch task" });
  }
});

// Update a task by ID
app.put("/tasks/:id", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing `text` in body" });

  try {
    const key = `task:${req.params.id}`;
    const existed = await redis.exists(key);
    if (!existed) return res.status(404).json({ error: "Not found" });
    await redis.hSet(key, "text", text);
    res.json({ id: parseInt(req.params.id, 10), text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update task" });
  }
});

// Delete one task
app.delete("/tasks/:id", async (req, res) => {
  try {
    const key = `task:${req.params.id}`;
    const existed = await redis.del(key);
    if (!existed) return res.status(404).json({ error: "Not found" });
    await redis.sRem("tasks", req.params.id);
    res.json({ deleted: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete task" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
