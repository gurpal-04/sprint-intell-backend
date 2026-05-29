const { exec } = require("child_process");

/**
 * Coral SQL Service - Integrates with the actual Coral CLI (withcoral.com)
 * or falls back gracefully to a high-fidelity mock scenario database.
 */
class CoralSqlService {
  /**
   * Executes a SQL query. If Coral CLI is installed locally on the host machine,
   * it triggers the live cli command: `coral sql "<QUERY>"`.
   * Otherwise, it runs the query against our rich mock scenario database.
   * @param {string} sqlQuery The raw SQL statement.
   * @param {Object} data Active scenario data (for mock fallback).
   * @returns {Promise<Object>} { columns: string[], rows: Object[] }
   */
  async executeSql(sqlQuery, data) {
    return new Promise((resolve) => {
      // 1. Try to execute the query against the actual live local Coral CLI
      const escapedQuery = sqlQuery.replace(/"/g, '\\"');
      
      // We run: coral sql "SELECT ..." 
      // In a real environment, Coral prints tabular records or JSON.
      exec(`coral sql "${escapedQuery}"`, (error, stdout, stderr) => {
        if (error) {
          console.warn(`[Coral SQL] Live CLI query failed:`, stderr || error.message);
          resolve({ error: stderr.trim() || error.message });
          return;
        }

        if (stdout) {
          try {
            console.log(`[Coral SQL] Live CLI query executed successfully!`);
            // Check if Coral output is JSON formatted. If so, parse it:
            if (stdout.trim().startsWith("[") || stdout.trim().startsWith("{")) {
              const parsed = JSON.parse(stdout);
              if (Array.isArray(parsed)) {
                resolve({
                  columns: parsed.length > 0 ? Object.keys(parsed[0]) : [],
                  rows: parsed
                });
                return;
              }
            } else {
              // If Coral returns a markdown table or CSV, we parse it:
              const result = this.parseTabularOutput(stdout);
              resolve(result);
              return;
            }
          } catch (parseErr) {
            console.warn(`[Coral SQL] Failed to parse live Coral CLI stdout:`, parseErr.message);
            resolve({ error: `Failed to parse Coral output: ${parseErr.message}. Output was: ${stdout}` });
            return;
          }
        }

        resolve({ columns: [], rows: [] });
      });
    });
  }

  parseTabularOutput(stdout) {
    const lines = stdout.split("\n").map(l => l.trim()).filter(l => l !== "" && !l.startsWith("-") && !l.startsWith("+"));
    if (lines.length === 0) return { columns: [], rows: [] };

    const isPipe = lines[0].includes("|");
    const delimiter = isPipe ? "|" : /\s+/;
    
    let columns = [];
    if (isPipe) {
      columns = lines[0].split("|").map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
    } else {
      columns = lines[0].split(/\s+/).map(c => c.trim()).filter(c => c !== "");
    }
    
    // Normalize column names to lowercase
    columns = columns.map(c => c.toLowerCase());

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      let cells = [];
      if (isPipe) {
        const rawCells = lines[i].split("|").map(c => c.trim());
        cells = rawCells.slice(1, rawCells.length - 1);
      } else {
        cells = lines[i].split(/\s+/).map(c => c.trim()).filter(c => c !== "");
      }
      
      if (cells.length === columns.length) {
        const row = {};
        columns.forEach((col, idx) => {
          row[col] = cells[idx];
        });
        rows.push(row);
      }
    }

    return { columns, rows };
  }

  /**
   * High-fidelity SQL evaluator that runs SELECT/JOIN queries against mock scenario objects.
   */
  executeMockSql(sqlString, data) {
    const cleanSql = sqlString.trim().replace(/\s+/g, " ");
    const sqlLower = cleanSql.toLowerCase();

    let table = "";
    if (sqlLower.includes("from linear.issues") || sqlLower.includes("from clickup.tasks")) table = "linear.issues";
    else if (sqlLower.includes("from github.pulls") || sqlLower.includes("from github.pull_requests")) table = "github.pulls";
    else if (sqlLower.includes("from linear.users")) table = "linear.users";
    else if (sqlLower.includes("from slack.channels")) table = "slack.channels";
    else if (sqlLower.includes("from slack.users")) table = "slack.users";
    else if (sqlLower.includes("from slack.messages")) table = "slack.messages";
    else if (sqlLower.includes("from team.engineers")) table = "team.engineers";

    let columns = [];
    let items = [];

    if (table === "linear.issues") {
      columns = ["id", "identifier", "title", "description", "priority", "priority_label", "estimate", "state_name", "state_type", "assignee_name", "assignee_id", "due_date", "stale_days", "created_at", "updated_at"];
      const baseIssues = data.linearIssues || data.clickupTasks || [];
      items = baseIssues.map(t => ({
        id: t.id,
        identifier: t.id,
        title: t.title,
        description: t.description || "",
        priority: t.priority === "Urgent" ? 1 : t.priority === "High" ? 2 : t.priority === "Medium" ? 3 : 4,
        priority_label: t.priority || "Medium",
        estimate: t.estimate || 0,
        state_name: t.state || "Todo",
        state_type: t.state === "Done" ? "completed" : t.state === "In Progress" ? "started" : "unstarted",
        assignee_name: t.assignee_id || "Unassigned",
        assignee_id: t.assignee_id || "",
        due_date: t.due_date || "",
        stale_days: t.stale_days || 0,
        created_at: t.start_date || "2026-05-20T00:00:00Z",
        updated_at: t.last_activity || "2026-05-24T00:00:00Z"
      }));
    } else if (table === "github.pulls") {
      columns = ["number", "repo", "title", "state", "draft", "merged", "merged_at", "created_at", "updated_at", "user__login", "requested_reviewer_logins", "stale_hours", "lines_added", "lines_removed"];
      items = data.githubPRs.map(pr => ({
        number: pr.number,
        repo: pr.repo,
        title: pr.title,
        state: pr.status === "Open" ? "open" : "closed",
        draft: pr.draft || false,
        merged: pr.status === "Merged",
        merged_at: pr.status === "Merged" ? pr.updatedDate : null,
        created_at: pr.createdDate || "2026-05-22T00:00:00Z",
        updated_at: pr.updatedDate || "2026-05-24T00:00:00Z",
        user__login: pr.authorId || "github-user",
        requested_reviewer_logins: (pr.reviewers || []).join(","),
        stale_hours: pr.staleHours || 0,
        lines_added: pr.linesAdded || 0,
        lines_removed: pr.linesRemoved || 0
      }));
    } else if (table === "linear.users") {
      columns = ["id", "name", "display_name", "email", "active"];
      items = data.engineers.map(e => ({
        id: e.id,
        name: e.name,
        display_name: e.handle ? e.handle.replace("@", "") : e.name.toLowerCase().replace(/\s+/g, ""),
        email: `${e.id.toLowerCase()}@company.com`,
        active: "true"
      }));
    } else if (table === "slack.channels") {
      columns = ["id", "name", "topic", "purpose", "num_members", "is_archived", "created"];
      const uniqueChannels = [...new Set(data.slackLogs.map(log => log.channel))];
      items = uniqueChannels.map((chan, idx) => ({
        id: `C${idx.toString().padStart(9, "0")}`,
        name: chan.replace("#", ""),
        topic: `Topic for ${chan}`,
        purpose: `Purpose of channel ${chan}`,
        num_members: data.engineers.length,
        is_archived: "false",
        created: 1779818375
      }));
    } else if (table === "slack.users") {
      columns = ["id", "name", "real_name", "display_name", "email", "is_bot", "is_admin", "deleted"];
      items = data.engineers.map(e => ({
        id: `U${e.id.replace("eng_", "").toUpperCase()}`,
        name: e.handle ? e.handle.replace("@", "") : e.name.toLowerCase().replace(/\s+/g, ""),
        real_name: e.name,
        display_name: e.handle ? e.handle.replace("@", "") : e.name.toLowerCase().replace(/\s+/g, ""),
        email: `${e.id.toLowerCase()}@company.com`,
        is_bot: "false",
        is_admin: e.role === "Tech Lead" ? "true" : "false",
        deleted: "false"
      }));
    } else if (table === "slack.messages") {
      columns = ["channel", "sender", "message", "timestamp"];
      items = data.slackLogs.map(log => ({
        channel: log.channel,
        sender: log.sender,
        message: log.message,
        timestamp: log.timestamp
      }));
    } else if (table === "team.engineers") {
      columns = ["id", "name", "handle", "role", "workload_score", "active_tasks", "pending_reviews", "status"];
      items = data.engineers.map(e => ({
        id: e.id,
        name: e.name,
        handle: e.handle,
        role: e.role,
        workload_score: e.workloadScore,
        active_tasks: e.activeTasks,
        pending_reviews: e.pendingReviews,
        status: e.status
      }));
    }

    // Handle JOINS
    if (sqlLower.includes("join") && sqlLower.includes("slack.messages") && (sqlLower.includes("linear.issues") || sqlLower.includes("clickup.tasks"))) {
      columns = ["task_id", "task_title", "task_status", "slack_sender", "slack_message", "slack_channel"];
      const joinedRows = [];
      const baseIssues = data.linearIssues || data.clickupTasks || [];
      baseIssues.forEach(task => {
        data.slackLogs.forEach(log => {
          if (log.message.includes(task.id) || log.message.toLowerCase().includes(task.title.toLowerCase().split(" ")[0])) {
            joinedRows.push({
              task_id: task.id,
              task_title: task.title,
              task_status: task.state || task.status,
              slack_sender: log.sender,
              slack_message: log.message,
              slack_channel: log.channel
            });
          }
        });
      });
      return { columns, rows: joinedRows };
    }

    if (!table) {
      if (sqlLower.includes("coral.tables")) {
        return {
          columns: ["schema_name", "table_name", "description"],
          rows: [
            { schema_name: "linear", table_name: "issues", description: "Sprint tickets and project status indexes" },
            { schema_name: "github", table_name: "pulls", description: "Active repositories pull review requests" },
            { schema_name: "slack", table_name: "channels", description: "Slack workspace channel indexes" },
            { schema_name: "slack", table_name: "users", description: "Slack workspace user dimension tables" },
            { schema_name: "team", table_name: "engineers", description: "Resource capacity allocations" }
          ]
        };
      }
      throw new Error("Syntax Error: Unknown table source. Please query from linear.issues, github.pulls, slack.messages, team.engineers, or coral.tables.");
    }

    // Apply WHERE filtering
    let filteredItems = [...items];
    const whereMatch = cleanSql.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|$)/i);
    if (whereMatch) {
      const filterExpr = whereMatch[1].replace(/['"]/g, "").trim();
      const eqMatch = filterExpr.match(/(\w+)\s*=\s*(.+)/);
      const gtMatch = filterExpr.match(/(\w+)\s*>\s*(.+)/);

      if (eqMatch) {
        const col = eqMatch[1].toLowerCase().trim();
        const val = eqMatch[2].toLowerCase().trim();
        filteredItems = filteredItems.filter(item => String(item[col]).toLowerCase() === val);
      } else if (gtMatch) {
        const col = gtMatch[1].toLowerCase().trim();
        const val = parseFloat(gtMatch[2].trim());
        filteredItems = filteredItems.filter(item => parseFloat(item[col]) > val);
      }
    }

    // Apply LIMIT
    const limitMatch = cleanSql.match(/limit\s+(\d+)/i);
    if (limitMatch) {
      const limitVal = parseInt(limitMatch[1], 10);
      filteredItems = filteredItems.slice(0, limitVal);
    }

    // Column projection
    const selectMatch = cleanSql.match(/select\s+(.+?)\s+from/i);
    if (selectMatch) {
      const selectColsText = selectMatch[1].trim();
      if (selectColsText !== "*") {
        const selectCols = selectColsText.split(",").map(c => c.trim().toLowerCase());
        const validSelectCols = selectCols.filter(c => columns.includes(c));
        if (validSelectCols.length > 0) {
          columns = validSelectCols;
          filteredItems = filteredItems.map(item => {
            const projected = {};
            validSelectCols.forEach(col => {
              projected[col] = item[col];
            });
            return projected;
          });
        }
      }
    }

    return {
      columns,
      rows: filteredItems
    };
  }
}

module.exports = new CoralSqlService();
