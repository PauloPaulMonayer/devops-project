const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ message: "Hello from DevOps project!" });
});

app.listen(PORT, () => {
  console.log(`Web service listening on http://localhost:${PORT}`);
});
