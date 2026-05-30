const geminiService = require("../services/gemini.service");

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

      console.log(`[AI Controller] Routing query to Gemini/Groq Agent in Strict Live Mode`);

      // Strictly pass null for activeData to enforce live Coral CLI executions
      const result = await geminiService.generateResponse(query, null, scenarioMeta);

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
      console.log(`[AI Controller] Generating live standup update`);

      // Strictly pass null for activeData to enforce live Coral CLI executions
      const result = await geminiService.generateResponse(standupQuery, null, scenarioMeta);
      res.json(result);
    } catch (err) {
      console.error("AI Controller Standup Error:", err);
      res.status(500).json({ error: "Failed to generate team standup summary.", details: err.message });
    }
  };
}

module.exports = new AIController();
