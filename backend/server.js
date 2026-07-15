const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { testConnection } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "EIRP Backend" });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/pages/:page", (req, res) => {
  const pageName = req.params.page;
  res.sendFile(path.join(__dirname, "../frontend/pages", `${pageName}.html`));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../frontend/pages/404.html"));
});

app.use(errorHandler);

async function startServer(port) {
  const dbReady = await testConnection();
  if (!dbReady) {
    console.error("Cannot connect to the MySQL database. Please verify database settings.");
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`\n✅ EIRP server is running!`);
    console.log(`🌐 Local:   http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.log(`Port ${port} is busy, trying ${port + 1}`);
      startServer(port + 1);
      return;
    }
    throw error;
  });
}

startServer(PORT);