const coralService = require("../services/coral.service");
const geminiService = require("../services/gemini.service");
const sprintController = require("./sprint.controller");

class AIController {
  /**
   * POST /api/ai/chat
   */
  chatWithAgent = async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Missing 'query' parameter in request body." });
      }

      const scenarioMeta = {
        id: 0,
        name: "Live Connection Mode",
        description: "Querying actual workspace data via the Coral CLI integrations. No mock data or scenario is active."
      };

      // 1. Perform simulated Coral Semantic Retrieval
      const retrievedDocs = await coralService.retrieveContext(query, null);

      // 2. Feed retrieved documents and query into Gemini AI Orchestration Layer
      const result = await geminiService.generateResponse(query, retrievedDocs, scenarioMeta);

      res.json(result);
    } catch (err) {
      console.error("AI Controller Chat Error:", err);
      res.status(500).json({ error: "Failed to generate AI reasoning response.", details: err.message });
    }
  };

  /**
   * POST /api/ai/standup
   */
  generateStandup = async (req, res) => {
    try {
      const scenarioMeta = {
        id: 0,
        name: "Live Connection Mode",
        description: "Querying actual workspace data via the Coral CLI integrations. No mock data or scenario is active."
      };

      const standupQuery = "Generate a daily standup progress and blocker summary for the entire team based on tasks and git PR progress.";
      const retrievedDocs = await coralService.retrieveContext(standupQuery, null);
      
      const result = await geminiService.generateResponse(standupQuery, retrievedDocs, scenarioMeta);
      res.json(result);
    } catch (err) {
      console.error("AI Controller Standup Error:", err);
      res.status(500).json({ error: "Failed to generate team standup summary.", details: err.message });
    }
  };
}

module.exports = new AIController();
