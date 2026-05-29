const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load Environment variables
dotenv.config();

const sprintController = require("./controllers/sprint.controller");
const aiController = require("./controllers/ai.controller");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// REST API Routes
// Sprint Operations
app.get("/api/sprint/overview", sprintController.getOverview);
app.get("/api/sprint/issues", sprintController.getIssues);
app.get("/api/sprint/pull-requests", sprintController.getPullRequests);

app.get("/api/sprint/team", sprintController.getTeam);
app.get("/api/sprint/timeline", sprintController.getTimeline);
app.get("/api/sprint/blockers", sprintController.getBlockers);
app.post("/api/sprint/scenario", sprintController.setScenario);

// AI & Retrieval Operations
app.post("/api/ai/chat", aiController.chatWithAgent);
app.post("/api/ai/standup", aiController.generateStandup);

// Coral SQL Operations
const coralSqlService = require("./services/coralSql.service");
app.post("/api/coral/sql", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Missing 'query' parameter." });
    }
    const data = sprintController.getActiveData();
    const result = await coralSqlService.executeSql(query, data);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Base Route
app.get("/", (req, res) => {
  res.json({
    name: "Sprint Intelligence Agent API Server",
    status: "online",
    activeScenario: sprintController.activeScenarioId,
    timestamp: new Date()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Backend Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message
  });
});

module.exports = app;
