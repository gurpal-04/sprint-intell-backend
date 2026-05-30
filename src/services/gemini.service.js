const groqService = require("./groq.service");
const coralSqlService = require("./coralSql.service");

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.initialized = false;
    this.ai = null;

    if (this.apiKey && this.apiKey !== "YOUR_API_KEY") {
      try {
        const SDK = require("@google/generative-ai");
        const GoogleGenerativeAI = SDK.GoogleGenerativeAI;
        if (GoogleGenerativeAI) {
          this.ai = new GoogleGenerativeAI(this.apiKey);
          this.initialized = true;
        }
      } catch (err) {
        console.error("Failed to initialize Google Gemini SDK:", err.message);
      }
    }
  }

  /**
   * Helper function to execute local database/workspace queries for tools.
   * Strictly queries the live Coral SQL CLI by passing `null` as activeData context.
   */
  async executeTool(name, args) {
    try {
      if (name === "queryLinearIssues") {
        console.log(`[Tool Executor] Fetching Linear issues strictly from live CLI...`);
        const result = await coralSqlService.executeSql(
          "SELECT identifier, title, description, state_name, assignee_name, estimate, updated_at FROM linear.issues",
          null
        );
        let rows = result.rows || [];

        // Apply filters in JS for 100% precision
        if (args.state) {
          rows = rows.filter(r => String(r.state_name).toLowerCase() === args.state.toLowerCase());
        }
        if (args.assignee) {
          const queryAssignee = args.assignee.toLowerCase().replace("@", "");
          rows = rows.filter(r => {
            const assigneeLower = String(r.assignee_name || "").toLowerCase();
            return assigneeLower.includes(queryAssignee);
          });
        }
        if (args.query) {
          const qLower = args.query.toLowerCase();
          rows = rows.filter(r => 
            String(r.title || "").toLowerCase().includes(qLower) || 
            String(r.description || "").toLowerCase().includes(qLower) ||
            String(r.identifier || "").toLowerCase().includes(qLower)
          );
        }
        return { source: "Linear", rows };

      } else if (name === "queryGitHubPRs") {
        console.log(`[Tool Executor] Fetching GitHub PRs strictly from live CLI...`);
        const owner = process.env.GITHUB_OWNER || "gurpal-04";
        const repo = process.env.GITHUB_REPO || "coral-demo";
        const result = await coralSqlService.executeSql(
          `SELECT number, title, repo, state, user__login, requested_reviewer_logins, updated_at FROM github.pulls WHERE owner = '${owner}' AND repo = '${repo}'`,
          null
        );
        let rows = result.rows || [];

        // Apply filters in JS for 100% precision
        if (args.state) {
          rows = rows.filter(r => String(r.state).toLowerCase() === args.state.toLowerCase());
        }
        if (args.author) {
          const queryAuthor = args.author.toLowerCase().replace("@", "");
          rows = rows.filter(r => String(r.user__login || "").toLowerCase().includes(queryAuthor));
        }
        if (args.query) {
          const qLower = args.query.toLowerCase();
          rows = rows.filter(r => 
            String(r.title || "").toLowerCase().includes(qLower) || 
            String(r.number || "").toLowerCase().includes(qLower)
          );
        }
        return { source: "GitHub", rows };

      } else if (name === "querySlackWorkspace") {
        console.log(`[Tool Executor] Fetching Slack workspace metadata strictly from live CLI...`);
        if (args.queryType === "users") {
          const result = await coralSqlService.executeSql("SELECT name, real_name, display_name, email FROM slack.users", null);
          return { source: "Slack Users", rows: result.rows || [] };
        } else {
          const result = await coralSqlService.executeSql("SELECT name, topic, purpose, num_members FROM slack.channels", null);
          return { source: "Slack Channels", rows: result.rows || [] };
        }

      } else if (name === "querySlackMessages") {
        console.log(`[Tool Executor] Querying Slack messages strictly from live CLI...`);
        let channelId = args.channel;
        if (!channelId) {
          return { error: "A channel name or ID must be specified to query Slack messages." };
        }

        // Resolve channel name to ID if it doesn't look like a standard Slack ID (starts with C/G/D)
        if (!channelId.startsWith("C") && !channelId.startsWith("G") && !channelId.startsWith("D")) {
          console.log(`[Tool Executor] Resolving Slack channel name "${channelId}" to ID...`);
          const channelResult = await coralSqlService.executeSql(
            `SELECT id FROM slack.channels WHERE name = '${channelId}'`, 
            null
          );
          if (channelResult.rows && channelResult.rows.length > 0) {
            channelId = channelResult.rows[0].id;
            console.log(`[Tool Executor] Resolved to channel ID "${channelId}"`);
          } else {
            return { error: `Slack channel with name "${channelId}" not found.` };
          }
        }

        // Query the messages table function, joining slack.users to resolve names
        let queryStr = `
          SELECT 
            COALESCE(u.real_name, u.display_name, m.user_id) AS user_name, 
            m.text, 
            m.ts, 
            m.subtype 
          FROM slack.messages(channel => '${channelId}') m
          LEFT JOIN slack.users u ON m.user_id = u.id
        `;
        if (args.query) {
          const qVal = args.query.replace(/'/g, "''");
          queryStr += ` WHERE LOWER(m.text) LIKE '%${qVal.toLowerCase()}%'`;
        }
        queryStr += " ORDER BY m.ts DESC LIMIT 50";

        const result = await coralSqlService.executeSql(queryStr, null);
        return { source: "Slack Messages", rows: result.rows || [] };
      }

      return { error: `Tool ${name} is not implemented.` };
    } catch (err) {
      console.error(`[Tool Executor] Error executing tool ${name}:`, err.message);
      return { error: err.message };
    }
  }

  /**
   * Orchestrates the AI reasoning pipeline using Groq (Llama-3) or Gemini with tool calling.
   * Strictly reasons over live database queries without mock fallbacks.
   * @param {string} query User query.
   * @param {Object} activeData Unused (Strictly live connection).
   * @param {Object} scenarioMeta Scenario metadata.
   * @returns {Promise<Object>} Response containing generated message and active citations.
   */
  async generateResponse(query, activeData, scenarioMeta) {
    const systemPrompt = `You are the "Sprint Intelligence Agent", an advanced AI Engineering Operations Partner.
Your goal is to help engineering managers analyze sprint risks, unblock teams, analyze human bottlenecks, and correlate multi-system logs across Linear, GitHub, and Slack.

You have access to native tools to query each workspace integration:
1. queryLinearIssues: Query tickets, estimates, statuses, and assignees.
2. queryGitHubPRs: Query active PRs, authors, reviewer allocations, and timestamps.
3. querySlackMessages: Search developer discussion logs, alerts, and notice updates.

Active Mode: Strictly querying actual live workspace records via the Coral CLI integrations. No mock data fallbacks.

INSTRUCTIONS:
1. When you need information to answer a user's query, call the appropriate tools. You can make multiple calls or call them sequentially.
2. Base your final answers strictly on the facts returned by the tools.
3. If a tool returns a schema error or missing table error (e.g. for Slack messages table not found), explain clearly that message-level archiving is not enabled in the current live Slack source.
4. Structure your response with clean markdown, using bold titles, bullet points, and warning blocks if there are critical incident regressions or bottleneck blocks.
5. Call out specific issue IDs (e.g., TES-10), PR numbers, and usernames with citations.
6. Provide actionable next steps at the end.`;

    // 1. Try Groq (Llama-3) first if enabled (implements native tool calling)
    if (groqService.enabled) {
      try {
        const groqResult = await groqService.generateResponse(
          systemPrompt,
          query,
          null, // Strictly live connection
          this.executeTool.bind(this)
        );
        if (groqResult) {
          return groqResult;
        }
      } catch (err) {
        console.warn("Groq execution failed, trying Gemini:", err.message);
      }
    }

    // 2. Try Google Gemini API with Native Function Calling
    if (this.initialized && this.ai) {
      try {
        const geminiTools = [
          {
            functionDeclarations: [
              {
                name: "queryLinearIssues",
                description: "Queries Linear issues and tasks to find identifiers, statuses, estimates, titles, descriptions, and assignees.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    assignee: { type: "STRING", nullable: true, description: "Filter by assignee display name or username (e.g. 'Gurpal Singh', 'Rohit')." },
                    state: { type: "STRING", nullable: true, description: "Filter by issue state/status (e.g., 'In Progress', 'Blocked', 'Done', 'Todo')." },
                    query: { type: "STRING", nullable: true, description: "Keyword or search term in task title or description." }
                  }
                }
              },
              {
                name: "queryGitHubPRs",
                description: "Queries active GitHub Pull Requests, including repository names, states, authors, requested reviewers, and update timestamps.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    author: { type: "STRING", nullable: true, description: "Filter by PR author username." },
                    state: { type: "STRING", nullable: true, description: "Filter by PR state ('open', 'closed', 'Merged')." },
                    query: { type: "STRING", nullable: true, description: "Keyword or search term in PR title." }
                  }
                }
              },
              {
                name: "querySlackWorkspace",
                description: "Queries Slack workspace metadata to list active channels and workspace members.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    queryType: { type: "STRING", nullable: true, description: "The type of query: 'channels' to list active channels and topics, or 'users' to list workspace members." }
                  }
                }
              },
              {
                name: "querySlackMessages",
                description: "Queries Slack messages from a specific channel with optional keyword search.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    channel: { type: "STRING", description: "The name or ID of the Slack channel to query (e.g. 'sprint-1-dev', 'C0B6KK2B7RU'). Required." },
                    query: { type: "STRING", nullable: true, description: "Optional keyword to filter messages by text." }
                  },
                  required: ["channel"]
                }
              }
            ]
          }
        ];

        const model = this.ai.getGenerativeModel({
          model: "gemini-1.5-flash",
          tools: geminiTools
        });

        // Start chat with system prompt context
        const chat = model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: systemPrompt }]
            },
            {
              role: "model",
              parts: [{ text: "Understood. I am online as the Sprint Intelligence Agent. I will use the available tools to query Linear, GitHub, and Slack logs dynamically as needed to answer your questions. Please ask your first question." }]
            }
          ]
        });

        console.log(`[Gemini AI] Starting live tool-calling session for query: "${query}"`);
        let response = await chat.sendMessage(query);
        let functionCalls = response.functionCalls();
        let loopCount = 0;
        const maxLoops = 5;
        const executedTools = [];

        while (functionCalls && functionCalls.length > 0 && loopCount < maxLoops) {
          loopCount++;
          console.log(`[Gemini AI] Agent requested ${functionCalls.length} tool calls (Turn ${loopCount}):`);
          
          const parts = [];
          for (const call of functionCalls) {
            const { name, args } = call;
            console.log(`   -> Calling Tool: ${name} with args:`, args);

            const toolResult = await this.executeTool(name, args);
            
            // Format for prompt response
            parts.push({
              functionResponse: {
                name: name,
                response: toolResult
              }
            });

            // Map for citation display in the frontend
            executedTools.push({
              source: toolResult.source || "System",
              id: args.query || args.assignee || args.channel || "All",
              title: `Query: ${args.query || "Filter"}`,
              content: toolResult.error 
                ? `Tool error: ${toolResult.error}`
                : `Retrieved ${toolResult.rows?.length || 0} items matching filters: ${JSON.stringify(args)}`
            });
          }

          response = await chat.sendMessage(parts);
          functionCalls = response.functionCalls();
        }

        const finalAnswer = response.text();
        return {
          answer: finalAnswer,
          retrievedDocs: executedTools,
          mode: `Gemini AI Live Tool Calling Mode (${loopCount} turns)`
        };

      } catch (err) {
        console.error("Gemini API call failed:", err);
        throw err;
      }
    }

    throw new Error("No live AI Service (Gemini or Groq) is initialized. Ensure your API keys are configured correctly.");
  }
}

module.exports = new GeminiService();
