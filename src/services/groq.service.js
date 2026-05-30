/**
 * Groq Service - Ultra-high-speed Llama-3 inference connection.
 * Communicates with the official Groq REST endpoint.
 */

const groqTools = [
  {
    type: "function",
    function: {
      name: "queryLinearIssues",
      description: "Queries Linear issues and tasks to find identifiers, statuses, estimates, titles, descriptions, and assignees.",
      parameters: {
        type: "object",
        properties: {
          assignee: { type: ["string", "null"], description: "Filter by assignee display name or username (e.g. '@sophia', 'Marcus Vance', 'Leo Russo')." },
          state: { type: ["string", "null"], description: "Filter by issue state/status (e.g., 'In Progress', 'Blocked', 'Done', 'Todo')." },
          query: { type: ["string", "null"], description: "Keyword or search term in task title or description." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "queryGitHubPRs",
      description: "Queries active GitHub Pull Requests, including repository names, states, authors, requested reviewers, and update timestamps.",
      parameters: {
        type: "object",
        properties: {
          author: { type: ["string", "null"], description: "Filter by PR author username." },
          state: { type: ["string", "null"], description: "Filter by PR state ('open', 'closed', 'Merged')." },
          query: { type: ["string", "null"], description: "Keyword or search term in PR title." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "querySlackWorkspace",
      description: "Queries Slack workspace metadata to list active channels and workspace members.",
      parameters: {
        type: "object",
        properties: {
          queryType: { type: ["string", "null"], description: "The type of query: 'channels' to list active channels and topics, or 'users' to list workspace members." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "querySlackMessages",
      description: "Queries Slack messages from a specific channel with optional keyword search.",
      parameters: {
        type: "object",
        properties: {
          channel: { type: "string", description: "The name or ID of the Slack channel to query (e.g. 'sprint-1-dev', 'C0B6KK2B7RU'). Required." },
          query: { type: ["string", "null"], description: "Optional keyword to filter messages by text." }
        },
        required: ["channel"]
      }
    }
  }
];

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || "llama3-8b-8192";
    this.enabled = !!(this.apiKey && this.apiKey !== "YOUR_GROQ_KEY");
  }

  /**
   * Generates a conversational response using Groq.
   * @param {string} systemPrompt System instructions outlining tools.
   * @param {string} userQuery Chat query.
   * @param {Object} activeData Current sprint/mock data object.
   * @param {Function} executeTool Callback function to run tools.
   * @returns {Promise<Object|null>} Chat response, or null if key is missing/fails.
   */
  async generateResponse(systemPrompt, userQuery, activeData, executeTool) {
    if (!this.enabled) return null;

    try {
      console.log(`[Groq AI] Initiating connection using model: ${this.model}...`);
      
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery }
      ];

      const executedDocs = [];
      let loopCount = 0;
      const maxLoops = 5;

      while (loopCount < maxLoops) {
        loopCount++;
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            tools: groqTools,
            tool_choice: "auto",
            temperature: 0.2,
            max_tokens: 1024
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Groq API returned an error");
        }

        const data = await response.json();
        const choice = data.choices[0];
        const message = choice?.message;

        if (!message) break;

        // Add model message to history
        messages.push(message);

        if (message.tool_calls && message.tool_calls.length > 0) {
          console.log(`[Groq AI] Agent requested ${message.tool_calls.length} tool calls (Turn ${loopCount}):`);
          
          for (const toolCall of message.tool_calls) {
            const { name, arguments: argsText } = toolCall.function;
            let args = {};
            try {
              args = JSON.parse(argsText);
            } catch (e) {
              console.warn("[Groq AI] Failed to parse tool arguments:", argsText);
            }

            console.log(`   -> Calling Tool: ${name} with args:`, args);
            const toolResult = await executeTool(name, args, activeData);
            
            // Format result back to the LLM
            executedDocs.push({
              source: toolResult.source || "System",
              id: args.query || args.assignee || args.channel || "All",
              title: `Query: ${args.query || "Filter"}`,
              content: `Retrieved ${toolResult.rows?.length || 0} rows matching filters: ${JSON.stringify(args)}`
            });

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: name,
              content: JSON.stringify(toolResult)
            });
          }
        } else {
          // No more tools, return final text and docs
          return {
            answer: message.content,
            retrievedDocs: executedDocs,
            mode: `Groq Llama-3 Tool Calling Mode (${loopCount} turns)`
          };
        }
      }

      return null;
    } catch (err) {
      console.error("Groq agent query failed:", err.message);
      return null;
    }
  }
}

module.exports = new GroqService();
