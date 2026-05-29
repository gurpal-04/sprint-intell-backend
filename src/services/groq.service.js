/**
 * Groq Service - Ultra-high-speed Llama-3 inference connection.
 * Communicates with the official Groq REST endpoint.
 */
class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || "llama3-8b-8192";
    this.enabled = !!(this.apiKey && this.apiKey !== "YOUR_GROQ_KEY");
  }

  /**
   * Generates a conversational response using Groq.
   * @param {string} prompt Ingested prompt incorporating system instructions.
   * @returns {Promise<string|null>} Chat response, or null if key is missing/fails.
   */
  async generateResponse(systemPrompt, userQuery) {
    if (!this.enabled) return null;

    try {
      console.log(`[Groq AI] Initiating connection using model: ${this.model}...`);
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery }
          ],
          temperature: 0.2,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Groq API returned an error");
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || null;
    } catch (err) {
      console.error("Groq query failed, falling back to Gemini:", err.message);
      return null;
    }
  }
}

module.exports = new GroqService();
