const express = require("express");
const { createClient } = require("redis");

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await redisClient.connect();
  console.log("Connected to Redis");
})();

app.get("/", async (req, res) => {
  try {
    const hits = await redisClient.incr("hits");
    res.json({
      message: "Hello from Paulo and Guy!",
      hits,
    });
  } catch (err) {
    console.error("Redis error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5. הפעלת השרת
app.listen(PORT, () => {
  console.log(`Web service listening on http://localhost:${PORT}`);
});
