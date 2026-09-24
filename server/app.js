const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const animalRoutes = require("./routes/animalRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const threadRoutes = require("./routes/threadRoutes");
const checkInRoutes = require("./routes/checkInRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/animals", animalRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/threads", threadRoutes);
app.use("/api/checkins", checkInRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
