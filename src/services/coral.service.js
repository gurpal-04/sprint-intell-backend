const coralSqlService = require("./coralSql.service");

/**
 * Coral Service - Simulates or executes an Enterprise Retrieval Layer.
 * It queries raw Linear, GitHub, and Slack records via Coral CLI and provides semantic matches
 * based on user queries, formatting them as contextual text documents.
 */
class CoralService {
  /**
   * Performs retrieval across multi-system collections.
   * @param {string} query The natural language user query.
   * @param {Object} data Active scenario data containing engineers, tasks, PRs, slack logs, and alerts.
   * @returns {Promise<Array>} List of retrieved documents with metadata.
   */
  async retrieveContext(query, data) {
    const q = query.toLowerCase();
    const retrievedDocs = [];

    // Helper: add document to retrieval context
    const addDoc = (source, id, title, content, relevance = 1.0) => {
      retrievedDocs.push({
        source,
        id,
        title,
        content,
        relevance
      });
    };

    // 1. Try to query live Linear and GitHub databases using Coral CLI
    try {
      // Linear Issues live semantic match
      const issuesResult = await coralSqlService.executeSql("SELECT identifier, title, description, state_name, assignee_name, updated_at FROM linear.issues", data);
      if (issuesResult && issuesResult.rows && issuesResult.rows.length > 0) {
        issuesResult.rows.forEach(task => {
          const matchText = `${task.identifier} ${task.title} ${task.description || ""} ${task.assignee_name || ""} issue issues task tasks ticket tickets sprint`.toLowerCase();
          const hasKeywordMatch = q.includes("issue") || q.includes("task") || q.includes("ticket") || q.includes("sprint") || q.split(" ").some(word => matchText.includes(word) || (word.length > 3 && matchText.includes(word)));
          if (hasKeywordMatch) {
            addDoc(
              "Linear",
              task.identifier,
              `Task: ${task.title}`,
              `Status: ${task.state_name}. Assignee: ${task.assignee_name || "Unassigned"}. Description: ${task.description || "No description"}. Last Updated: ${task.updated_at}`,
              0.9
            );
          }
        });
      }

      // GitHub Pulls live semantic match
      const owner = process.env.GITHUB_OWNER || "gurpal-04";
      const repo = process.env.GITHUB_REPO || "coral-test";
      const prsResult = await coralSqlService.executeSql(`SELECT number, title, state, updated_at, user__login FROM github.pulls WHERE owner = '${owner}' AND repo = '${repo}'`, data);
      if (prsResult && prsResult.rows && prsResult.rows.length > 0) {
        prsResult.rows.forEach(pr => {
          const matchText = `${pr.number} ${pr.title} ${pr.user__login} pr prs pull pulls pullrequest pullrequests`.toLowerCase();
          const hasKeywordMatch = q.includes("pr") || q.includes("pull") || q.split(" ").some(word => matchText.includes(word) || (word.length > 3 && matchText.includes(word)));
          if (hasKeywordMatch) {
            addDoc(
              "GitHub",
              `PR-${pr.number}`,
              `Pull Request: ${pr.title}`,
              `Repo: ${repo}. Status: ${pr.state}. Author: ${pr.user__login}. Last Updated: ${pr.updated_at}`,
              0.85
            );
          }
        });
      }

      // Slack Messages live semantic match
      const slackResult = await coralSqlService.executeSql("SELECT channel, sender, message, timestamp FROM slack.messages", data);
      if (slackResult && slackResult.rows && slackResult.rows.length > 0) {
        slackResult.rows.forEach(log => {
          const matchText = `${log.channel} ${log.sender} ${log.message} slack message chat convo conversation sick notices triage`.toLowerCase();
          const hasKeywordMatch = q.includes("slack") || q.includes("chat") || q.includes("message") || q.includes("convo") || q.includes("say") || q.includes("sick") || q.includes("post") || q.split(" ").some(word => matchText.includes(word) || (word.length > 3 && matchText.includes(word)));
          if (hasKeywordMatch) {
            addDoc(
              "Slack",
              log.channel,
              `Slack Message by ${log.sender}`,
              `Channel: ${log.channel}. Message: "${log.message}". Date: ${log.timestamp}`,
              0.8
            );
          }
        });
      }
    } catch (err) {
      console.warn("[Coral Context] Failed to query live Coral CLI:", err.message);
    }

    // Deduplicate and return retrieved chunks sorted by relevance
    const uniqueDocs = [];
    const seen = new Set();
    for (const doc of retrievedDocs) {
      const key = `${doc.source}-${doc.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDocs.push(doc);
      }
    }

    return uniqueDocs.sort((a, b) => b.relevance - a.relevance);
  }
}

module.exports = new CoralService();
