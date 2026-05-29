const groqService = require("./groq.service");

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
        console.error("Failed to initialize Google Gemini SDK, falling back to mock mode:", err.message);
      }
    }
  }

  /**
   * Orchestrates the AI reasoning pipeline using Groq (Llama-3) or Gemini, falling back to mock database rows.
   * @param {string} query User query.
   * @param {Array} retrievedDocs Context documents fetched via Coral.
   * @param {Object} scenarioMeta Active scenario description and details.
   * @returns {Promise<Object>} Response containing generated message and active context citations.
   */
  async generateResponse(query, retrievedDocs, scenarioMeta) {
    const contextText = retrievedDocs
      .map((doc, idx) => `[Document ${idx + 1}] Source: ${doc.source} (${doc.id})\nTitle: ${doc.title}\nContent: ${doc.content}\n---\n`)
      .join("\n");

    const systemPrompt = `You are the "Sprint Intelligence Agent", an advanced AI Engineering Operations Partner.
Your goal is to help engineering managers analyze sprint risks, unblock teams, analyze human bottlenecks, and correlate multi-system logs across Linear, GitHub, and Slack.

You have access to a simulated Coral Retrieval Layer which has pulled the following documents relevant to the user's query.
Active Scenario: "${scenarioMeta.name}" (Description: ${scenarioMeta.description})

RETIREVED MULTI-SYSTEM CONTEXT DOCUMENTS:
${contextText || "No context documents retrieved for this query."}

INSTRUCTIONS:
1. Base your answers strictly on the retrieved documents and scenario details.
2. Provide a highly professional, engineering-manager-level summary.
3. Structure your response with markdown, using bullet points, bold text, and code blocks for tables or alerts where appropriate.
4. Call out specific issues (e.g. LIN-104), PRs (e.g. PR-202), and Slack messages with citations.
5. Provide actionable next steps or suggested commands at the end.
6. If the data indicates a sickness, incident, or severe bottleneck, highlight it in a markdown warning block.`;

    // 1. Try Groq (Llama-3) first if enabled
    if (groqService.enabled) {
      try {
        const groqAnswer = await groqService.generateResponse(systemPrompt, query);
        if (groqAnswer) {
          return {
            answer: groqAnswer,
            retrievedDocs,
            mode: "Groq Llama-3 Mode"
          };
        }
      } catch (err) {
        console.warn("Groq execution failed, trying Gemini:", err.message);
      }
    }

    // 2. Try Google Gemini API
    if (this.initialized && this.ai) {
      try {
        const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({
          contents: [
            { role: "user", parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }] }
          ]
        });
        const responseText = result.response.text();
        return {
          answer: responseText,
          retrievedDocs,
          mode: "Gemini AI Mode"
        };
      } catch (err) {
        console.error("Gemini API call failed, using mock generator:", err);
      }
    }

    // 3. Mock data reasoning disabled
    return {
      answer: `### ❌ AI Reasoning Offline (API Key Missing)

To test live conversational reasoning over actual workspace records, please configure your **GEMINI_API_KEY** or **GROQ_API_KEY** in the [backend/.env](file:///Users/panda/Projects/coral-test/backend/.env) file. 

*Mock reasoning and database scenario fallbacks are currently disabled.*`,
      retrievedDocs,
      mode: "Offline Mode (Keys Not Configured)"
    };
  }

  generateMockResponse(query, retrievedDocs, scenarioMeta) {
    const q = query.toLowerCase();
    const sid = scenarioMeta.id;

    if (q.includes("pr") || q.includes("pull") || q.includes("issue") || q.includes("task") || q.includes("ticket")) {
      const githubPRs = retrievedDocs.filter(doc => doc.source.toLowerCase() === "github");
      const linearIssues = retrievedDocs.filter(doc => doc.source.toLowerCase() === "linear");

      let response = `### 🤖 Live Workspace Items (Sandbox Mode)\n\n`;
      response += `I queried the local **Coral Retrieval Layer** for you. Here are the live items matching your request:\n\n`;

      if (githubPRs.length > 0) {
        response += `#### 📂 GitHub Pull Requests\n`;
        githubPRs.forEach(pr => {
          response += `* **[${pr.id}] ${pr.title.replace("Pull Request: ", "")}**\n  - *Context*: ${pr.content}\n`;
        });
        response += `\n`;
      }

      if (linearIssues.length > 0) {
        response += `#### 📋 Linear Issues & Tasks\n`;
        linearIssues.forEach(task => {
          const title = task.title.replace("Task: ", "");
          response += `* **[${task.id || "Linear Task"}] ${title || "Task"}**\n  - *Context*: ${task.content}\n`;
        });
        response += `\n`;
      }

      if (githubPRs.length === 0 && linearIssues.length === 0) {
        response += `*No matching live open pull requests or active issues were found in the current context.*`;
      } else {
        response += `> [!NOTE]\n`;
        response += `> These details were successfully queried live from your local workspace integrations via the **Coral CLI**!`;
      }

      return response;
    }

    if (q.includes("delay") || q.includes("blocked") || q.includes("why is")) {
      if (sid === 1) {
        return `### ⚠️ Sprint 24 Delay Analysis

Our Coral retrieval engine has correlated logs across **Linear**, **GitHub**, and **Slack** to identify the primary critical path blockages delaying the sprint:

#### 1. Stuck Dependency Blockage
* **Blocked Issue**: [LIN-108] **Create User Profile Settings & Integration Connectors** assigned to **Leo Russo** (3 pts).
* **Root Cause Blocker**: Leo is blocked on merging his task until the core Gemini API ingestion endpoint is completed. This backend work is managed in Linear issue [LIN-102] and implemented in open **GitHub Pull Request [PR-202]** (*"feat(gemini): connect chat orchestrator endpoint"*).
* **Review Pipeline Stuck**: **PR-202** has been open for **27 hours** with no activity. The designated DevOps reviewer, **Chloe Diaz**, is currently flagged as **Out Sick** in Slack logs with a high fever.

#### 2. Resource Constraints
* **Marcus Vance** (Senior Backend Engineer) is currently **98% overloaded** with database indexing work in [LIN-101] (PR-201) and does not have the capacity to step in and review Chloe's pipeline changes.

---

### 📋 Suggested Action Items
> [!IMPORTANT]
> **Recommended Actions to Unblock Sprint 24:**
> 1. **Reassign PR-202 Reviewer**: Reassign **PR-202** review duty from Chloe Diaz to **Sophia Chen** (Tech Lead) immediately to bypass the pipeline block.
> 2. **Establish Staging Deployment Override**: Have Sophia override Chloe's sick status in GitHub actions to trigger the staging deploy manually once PR-202 gets the green light.
> 3. **Reschedule Task LIN-108**: Advise Leo Russo to temporarily pause settings UI work and assist Sophia with PR audits to reduce Marcus's backlog.`;
      }

      if (sid === 2) {
        return `### 🚨 Post-Deployment Incident Delay
The sprint pipeline is halted because of a critical staging incident reported in Slack:

* **Trigger Incident**: Deployment alert **TypeError: Cannot read properties of undefined (reading 'avatar')** at \`App.jsx:42\`.
* **Correlated Event**: Merged **PR-203** by **Leo Russo** (*"ui(dashboard): dark-mode glassmorphic layouts & custom scrollbars"*) which went live in staging 15 minutes before the crash spike.
* **Incident Impact**: Staging builds are currently unusable, halting Emma's automated test suites (LIN-105).

---

### 📋 Suggested Action Items
> [!CAUTION]
> **Active Emergency Protocol:**
> 1. **Deploy Staging Rollback**: Initiate a pipeline rollback to the previous stable staging container (Commit: \`9e24a10\`).
> 2. **Optional Chaining Hotfix**: Leo Russo must push an immediate patch replacing line 42 with optional chaining (\`user?.profile?.avatar\`) to resolve null profiles crash.
> 3. **Unblock QA**: Emma Watson's E2E checks (LIN-105) must hold execution until staging rollback compiles successfully.`;
      }

      return `### ⚠️ General Sprint Bottlenecks
We have retrieved several blocks:
- **Marcus Vance** is marked as a critical bottleneck (workload score **95%**), assigned to multiple urgent tasks.
- **PR-201** and **PR-202** are open awaiting review, stalling backend integrations.
- **LIN-104** (Timeline Widget) shows stagnant progress with no git pushes in the last 3 days.`;
    }

    if (q.includes("overloaded") || q.includes("bottleneck") || q.includes("who is")) {
      return `### 📊 Human Bottlenecks & Team Workload Analysis

Based on cross-tool capacity data, we have flagged **Marcus Vance** as a severe bottleneck for Sprint 24:

| Engineer | Active Tasks | Pending Reviews | Workload Score | Status |
| :--- | :---: | :---: | :---: | :--- |
| **Marcus Vance** | 4 | 6 | **98%** | 🔴 **Critical Bottleneck** |
| **Sophia Chen** | 2 | 1 | **40%** | 🟢 Healthy |
| **Leo Russo** | 2 | 0 | **60%** | 🟢 Healthy |
| **Emma Watson** | 2 | 1 | **50%** | 🟢 Healthy |
| **Chloe Diaz** | 1 | 1 | **30%** | 🟢 Healthy (Scenario dependent) |

#### Bottleneck Details:
1. **Review Queue Depth**: Marcus has **6 pending reviews** assigned in GitHub, resulting in stale rates (>24h) for other engineers' PRs.
2. **Heavy Active Tasks**: Marcus is simultaneously tackling [LIN-101] (Coral Retrieval Service - 8 pts) and [LIN-102] (Gemini Integration - 5 pts).

---

### 📋 Recommended Load Balancing
* **Reassign Code Reviews**: Sophia should reassign **PR-205** and **PR-206** reviews away from Marcus.
* **Redistribute Scope**: Delegate automated index audits (LIN-107) to help offload backend context logic.`;
    }

    if (q.includes("incident") || q.includes("error") || q.includes("crash")) {
      return `### 🔍 Incident Correlation Report

Coral correlated Slack discussion and GitHub Git history:

* **Staging Crash Name**: \`TypeError: Cannot read properties of undefined (reading 'avatar')\` at \`App.jsx:42\`.
* **Incident Reports**: Multiple user sessions affected on staging within minutes of deploy.
* **Correlated Commit**: GitHub merge **PR-203** (*"ui(dashboard): dark-mode glassmorphic layouts & custom scrollbars"*) by **Leo Russo**.
* **Slack Discussion**: Staging incident alerts in \`#ops-alerts\` led to a triage discussion in \`#sprint-24-dev\` involving Chloe, Leo, and Sophia.

---

### 🛠️ Root Cause & Fix
The avatar layout assumes a nested profile structure (\`user.profile.avatar\`) without validating if \`profile\` is populated. In the staging DB, new test users do not have a profile, leading to the crash.
**Fix suggestion**:
\`\`\`javascript
// In App.jsx line 42:
- <img src={user.profile.avatar} />
+ <img src={user?.profile?.avatar || DEFAULT_AVATAR_URL} />
\`\`\``;
    }

    if (q.includes("silent") || q.includes("no activity") || q.includes("stale") || q.includes("3 days")) {
      return `### 🕵️ Silent Blocker Detection Alert

The agent has automatically flagged a **Critical Silent Blocker** in Sprint 24:

* **Issue**: [LIN-104] **Build Event Correlation Timeline Widget** (5 pts)
* **Assignee**: **Leo Russo**
* **Flag Status**: 🔴 **Critical Stagnancy**
* **Correlation Evidence**:
  - **Linear**: Marked *"In Progress"* for **5 consecutive days**. Last activity dated **May 19**.
  - **GitHub**: **Zero git commits** pushed on branches relating to timeline widgets. **No Draft PR** created.
  - **Slack**: Sophia pinged Leo in \`#sprint-24-dev\` on **May 23** and **May 24** asking for status updates, with **zero replies**.
  - **Other Channels**: Leo Russo has been highly active in the **#gaming-zone** channel, posting about unlocking Valorant skins at **14:00 today**.

---

### 💡 Recommendation
Leo is likely stuck on the timeline visualization layout (or distracted). The Tech Lead (**Sophia**) should schedule a 15-minute pairing session with Leo to align on Recharts/Framer-motion visual layouts and unblock the ticket.`;
    }

    if (q.includes("standup") || q.includes("summary")) {
      return `### 📝 Sprint 24 Standup Summary Generator

Generated from raw task logs and git commits for **May 24**:

#### 👩‍💻 Sophia Chen (Tech Lead)
* **Yesterday (Done)**: Audited database composite constraints and index rules.
* **Today (Plan)**: Assist with Gemini Express controller integrations; review Marcus's vector indexing PR-201.
* **Blockers**: None.

#### 👨‍💻 Marcus Vance (Senior Backend Engineer)
* **Yesterday (Done)**: Finished testing vector search indexing configurations; initialized Gemini router controllers (PR-202).
* **Today (Plan)**: Fix multi-tenant lookups; resolve open PR reviews.
* **Blockers**: Massive review backlog (6 pending PRs).

#### 👦 Leo Russo (Frontend Engineer)
* **Yesterday (Done)**: Initialized settings integration panel templates.
* **Today (Plan)**: Complete Framer-motion interactive components for the Timeline view.
* **Blockers**: Stuck on timeline SVG correlation nodes (Flagged as silent blocker).`;
    }

    return `### 🤖 Sprint Intelligence Assistant

I am connected to the **Coral Retrieval Layer** simulating access to **Linear**, **GitHub**, and **Slack**.

Here is a summary of the active sprint:
* **Sprint**: Sprint 24
* **Health Score**: ${scenarioMeta.id === 1 ? "68%" : scenarioMeta.id === 2 ? "45%" : scenarioMeta.id === 3 ? "58%" : "82%"}
* **Active Scenario**: ${scenarioMeta.name}
* **Retrieved context chunks**: Checked ${retrievedDocs.length} documents.

How can I help you troubleshoot? You can ask:
1. *"Why is the sprint delayed?"*
2. *"Who is overloaded with reviews?"*
3. *"Are there any active production bugs?"*
4. *"Detect silent blockers."*
5. *"Generate a standup summary for the team."*`;
  }
}

module.exports = new GeminiService();
