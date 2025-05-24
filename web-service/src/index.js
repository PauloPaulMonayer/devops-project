// The code inside your methods are not readable, Next time please use meaningful names for methods, endpoints and variables also add blank lines after variable declarations and before return statements for better readability.
// In addition use blank lines to separate logical blocks of code, this will make it easier to read and understand the code.

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

// health check - Commetns on the code should exist only if they add value (In this case, they do not since they are self-explanatory)
app.get("/health", (req, res) => {
  res.json({ status: "ok", redis: redis.isOpen ? "connected" : "down" });
});

// Create a new task - Commetns on the code should exist only if they add value (In this case, they do not since they are self-explanatory)
app.post("/tasks", async (req, res) => { // Use meaningful names for methods, andpoints and variables
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing `text` in body" }); // add blank line before return statement for better readability

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

// List all tasks - Commetns on the code should exist only if they add value (In this case, they do not since they are self-explanatory)
app.get("/tasks", async (req, res) => {
  try {
    const ids = await redis.sMembers("tasks");
    const pipeline = redis.multi(); // Add a blank after variable declaration for better readability
    ids.forEach((id) => pipeline.hGetAll(`task:${id}`));
    const raw = await pipeline.exec();
    const tasks = raw.map((t) => ({ id: t.id, text: t.text }));
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch tasks" });
  }
});

// Get single task by ID - Commetns on the code should exist only if they add value (In this case, they do not since they are self-explanatory)
app.get("/tasks/:id", async (req, res) => {
  try {
    const key = `task:${req.params.id}`;
    const exists = await redis.exists(key); // Add a blank after variable declaration for better readability
    if (!exists) return res.status(404).json({ error: "Not found" }); // add blank line before return statement for better readability also Consider new line for return statement for better readability
    const data = await redis.hGetAll(key);
    res.json({ id: data.id, text: data.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch task" });
  }
});

// Update a task by ID - Commetns on the code should exist only if they add value (In this case, they do not since they are self-explanatory)
app.put("/tasks/:id", async (req, res) => {
  const { text } = req.body; // Add a blank after variable declaration for better readability
  if (!text) return res.status(400).json({ error: "Missing `text` in body" }); // Consider new line for return statement for better readability

  try {
    const key = `task:${req.params.id}`;
    const existed = await redis.exists(key); // Add a blank after variable declaration for better readability
    if (!existed) return res.status(404).json({ error: "Not found" }); // add blank line before if statement for better readability
    await redis.hSet(key, "text", text);
    res.json({ id: parseInt(req.params.id, 10), text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update task" });
  }
});

// Delete one task - Commetns on the code should exist only if they add value (In this case, they do not since they are self-explanatory)
app.delete("/tasks/:id", async (req, res) => {
  try {
    const key = `task:${req.params.id}`;
    const existed = await redis.del(key); // Add a blank after variable declaration for better readability
    if (!existed) return res.status(404).json({ error: "Not found" }); // add blank line before if statement for better readability
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
