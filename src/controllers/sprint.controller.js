const scenarios = require("../data/scenarios");
const correlationService = require("../services/correlation.service");
const coralSqlService = require("../services/coralSql.service");

class SprintController {
  constructor() {
    this.activeScenarioId = 1; // Default: Dependency Stuck
  }

  getActiveData = () => {
    return scenarios[this.activeScenarioId];
  };

  /**
   * Internal data fetcher for sprint overview metrics
   */
  fetchOverviewData = async () => {
    const owner = process.env.GITHUB_OWNER || "gurpal-04";
    const repo = process.env.GITHUB_REPO || "coral-test";

    // 1. Query live Linear issues
    const issuesQuery = "SELECT id, identifier, estimate, state_name, state_type, updated_at FROM linear.issues";
    const issuesResult = await coralSqlService.executeSql(issuesQuery, null);
    if (issuesResult.error) {
      throw new Error(issuesResult.error);
    }

    // 2. Query live GitHub pulls
    const prsQuery = `SELECT number, state, updated_at FROM github.pulls WHERE owner = '${owner}' AND repo = '${repo}'`;
    const prsResult = await coralSqlService.executeSql(prsQuery, null);
    if (prsResult.error) {
      throw new Error(prsResult.error);
    }

    const issues = issuesResult.rows || [];
    const prs = prsResult.rows || [];

    // Compute metrics
    const blockedCount = issues.filter(t => t.state_name === "Blocked" || t.state_type === "blocked").length;
    const openPRs = prs.filter(p => p.state === "open").length;

    let stalePRs = 0;
    prs.forEach(p => {
      if (p.state === "open" && p.updated_at) {
        const staleHours = Math.max(0, Math.round((Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60)));
        if (staleHours > 24) stalePRs++;
      }
    });

    let staleTasks = 0;
    issues.forEach(t => {
      if ((t.state_name === "In Progress" || t.state_type === "started") && t.updated_at) {
        const staleDays = Math.max(0, Math.floor((Date.now() - new Date(t.updated_at).getTime()) / (1000 * 60 * 60 * 24)));
        if (staleDays >= 3) staleTasks++;
      }
    });

    // Sum points
    let totalPoints = 0;
    let donePoints = 0;
    issues.forEach(t => {
      const pts = parseInt(t.estimate, 10) || 0;
      totalPoints += pts;
      if (t.state_name === "Done" || t.state_type === "completed") {
        donePoints += pts;
      }
    });

    const velocity = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

    // Calculate health score dynamically
    let score = 95;
    score -= blockedCount * 12;
    score -= stalePRs * 5;
    score -= staleTasks * 8;
    
    const activeIncidents = 0;
    score = Math.max(15, Math.min(100, score));

    return {
      scenarioId: this.activeScenarioId,
      scenarioName: `Live Connection Mode`,
      scenarioDescription: `Connected to live GitHub repo '${owner}/${repo}' and Linear team integrations.`,
      healthScore: score,
      metrics: {
        blockedTasks: blockedCount,
        openPRs: openPRs,
        stalePRs: stalePRs,
        staleTasks: staleTasks,
        activeIncidents: activeIncidents,
        overloadedEngineers: blockedCount > 0 ? 1 : 0,
        donePoints,
        totalPoints,
        velocity
      }
    };
  };

  /**
   * GET /api/sprint/overview
   */
  getOverview = async (req, res) => {
    try {
      const data = await this.fetchOverviewData();
      return res.json(data);
    } catch (err) {
      console.error("[Sprint Controller] getOverview failed:", err.message);
      res.status(500).json({ error: err.message });
    }
  };

  getOverviewFallback = (data) => {
    let score = 95;
    const blockedCount = data.linearIssues.filter(t => t.state === "Blocked").length;
    score -= blockedCount * 12;
    const activeIncidents = 0;
    const overloadedCount = data.engineers.filter(e => e.status === "Overloaded" || e.status === "Critical Bottleneck").length;
    score -= overloadedCount * 10;
    const stalePRs = data.githubPRs.filter(p => p.status === "Open" && p.staleHours > 24).length;
    score -= stalePRs * 5;
    const staleTasks = data.linearIssues.filter(t => t.stale_days >= 3).length;
    score -= staleTasks * 8;
    score = Math.max(15, Math.min(100, score));

    const totalPoints = data.linearIssues.reduce((acc, t) => acc + t.estimate, 0);
    const donePoints = data.linearIssues.filter(t => t.state === "Done").reduce((acc, t) => acc + t.estimate, 0);
    const velocity = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

    return {
      scenarioId: this.activeScenarioId,
      scenarioName: data.name,
      scenarioDescription: data.description,
      healthScore: score,
      metrics: {
        blockedTasks: blockedCount,
        openPRs: data.githubPRs.filter(p => p.status === "Open").length,
        stalePRs: stalePRs,
        staleTasks: staleTasks,
        activeIncidents: activeIncidents,
        overloadedEngineers: overloadedCount,
        donePoints,
        totalPoints,
        velocity
      }
    };
  };

  /**
   * Internal data fetcher for sprint issues
   */
  fetchIssuesData = async () => {
    const sqlQuery = "SELECT id, identifier, title, description, priority_label, estimate, state_name, state_type, assignee_name, assignee_id, created_at, updated_at, due_date, url FROM linear.issues";
    const result = await coralSqlService.executeSql(sqlQuery, null);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    const rows = result.rows || [];
    return rows.map(row => {
      let staleDays = 0;
      if (row.updated_at) {
        const lastUpdated = new Date(row.updated_at).getTime();
        staleDays = Math.max(0, Math.floor((Date.now() - lastUpdated) / (1000 * 60 * 60 * 24)));
      }
      
      return {
        id: row.identifier || row.id || "LIN-999",
        title: row.title || "Untitled Task",
        state: row.state_name || "Todo",
        priority: row.priority_label || "Medium",
        assignee_id: row.assignee_name || row.assignee_id || "Unassigned",
        estimate: parseInt(row.estimate, 10) || 0,
        due_date: row.due_date ? row.due_date.split("T")[0] : null,
        description: row.description || "",
        dependencies: [],
        stale_days: staleDays
      };
    });
  };

  /**
   * GET /api/sprint/issues
   */
  getIssues = async (req, res) => {
    try {
      const data = await this.fetchIssuesData();
      return res.json(data);
    } catch (err) {
      console.error("[Sprint Controller] getIssues failed:", err.message);
      res.status(500).json({ error: err.message });
    }
  };

  /**
   * Internal data fetcher for pull requests
   */
  fetchPullRequestsData = async () => {
    const owner = process.env.GITHUB_OWNER || "gurpal-04";
    const repo = process.env.GITHUB_REPO || "coral-test";

    const sqlQuery = `SELECT number, title, repo, state, draft, merged, merged_at, created_at, updated_at, user__login, requested_reviewer_logins FROM github.pulls WHERE owner = '${owner}' AND repo = '${repo}'`;
    const result = await coralSqlService.executeSql(sqlQuery, null);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    const rows = result.rows || [];
    return rows.map(row => {
      let staleHours = 0;
      if (row.updated_at) {
        const lastUpdated = new Date(row.updated_at).getTime();
        staleHours = Math.max(0, Math.round((Date.now() - lastUpdated) / (1000 * 60 * 60)));
      }

      let reviewers = [];
      if (row.requested_reviewer_logins) {
        reviewers = Array.isArray(row.requested_reviewer_logins) 
          ? row.requested_reviewer_logins 
          : row.requested_reviewer_logins.split(",").map(r => r.trim()).filter(r => r !== "");
      }

      const status = row.merged === true || String(row.merged) === "true" 
        ? "Merged" 
        : (row.state === "open" ? "Open" : "Closed");

      return {
        id: `PR-${row.number}`,
        number: parseInt(row.number, 10),
        title: row.title || "Untitled PR",
        repo: row.repo || repo,
        status: status,
        draft: row.draft === true || String(row.draft) === "true",
        authorId: row.user__login || "unknown",
        reviewers: reviewers,
        staleHours: staleHours,
        linesAdded: 0,
        linesRemoved: 0,
        comments: []
      };
    });
  };

  /**
   * GET /api/sprint/pull-requests
   */
  getPullRequests = async (req, res) => {
    try {
      const data = await this.fetchPullRequestsData();
      return res.json(data);
    } catch (err) {
      console.error("[Sprint Controller] getPullRequests failed:", err.message);
      res.status(500).json({ error: err.message });
    }
  };

  /**
   * Internal data fetcher for team allocations
   */
  fetchTeamData = async () => {
    const usersQuery = "SELECT id, name, display_name, email FROM linear.users WHERE active = true";
    const usersResult = await coralSqlService.executeSql(usersQuery, null);
    
    if (usersResult.error) {
      throw new Error(usersResult.error);
    }
    
    const usersRows = usersResult.rows || [];
    if (usersRows.length === 0) {
      return [];
    }
    
    const issuesQuery = "SELECT assignee_id, state_type, estimate FROM linear.issues";
    const issuesResult = await coralSqlService.executeSql(issuesQuery, null);
    
    const activeCounts = {};
    const activePoints = {};
    if (issuesResult && issuesResult.rows) {
      issuesResult.rows.forEach(row => {
        if (row.state_type === "started" || row.state_type === "unstarted") {
          const uId = row.assignee_id;
          if (uId) {
            const pts = parseInt(row.estimate, 10) || 0;
            activeCounts[uId] = (activeCounts[uId] || 0) + 1;
            activePoints[uId] = (activePoints[uId] || 0) + pts;
          }
        }
      });
    }
    
    return usersRows.map(row => {
      const activeTasks = activeCounts[row.id] || 0;
      const activePts = activePoints[row.id] || 0;
      
      // Dynamic capacity score assuming 8 story points limit per sprint
      const workloadScore = Math.min(100, Math.round((activePts / 8) * 100));
      let status = "Healthy";
      if (workloadScore >= 75) status = "Overloaded";
      if (workloadScore >= 95) status = "Critical Bottleneck";
      
      const handle = "@" + (row.display_name || row.name.toLowerCase().replace(/\s+/g, ""));
      
      return {
        id: row.id,
        name: row.name,
        handle: handle,
        role: "Developer",
        avatar: `https://images.unsplash.com/photo-${row.name.charCodeAt(0) % 2 === 0 ? "1494790108377-be9c29b29330" : "1507003211169-0a1dd7228f2d"}?w=150`,
        workloadScore: workloadScore,
        activeTasks: activeTasks,
        pendingReviews: 0,
        status: status,
        bio: `Developer in the team working on active sprints with ${activePts} active story points.`
      };
    });
  };

  /**
   * GET /api/sprint/team
   */
  getTeam = async (req, res) => {
    try {
      const data = await this.fetchTeamData();
      return res.json(data);
    } catch (err) {
      console.error("[Sprint Controller] getTeam failed:", err.message);
      res.status(500).json({ error: err.message });
    }
  };

  /**
   * Internal data fetcher for sprint timeline
   */
  fetchTimelineData = async () => {
    const owner = process.env.GITHUB_OWNER || "gurpal-04";
    const repo = process.env.GITHUB_REPO || "coral-test";
    
    // 1. Fetch Linear issues with both created_at and updated_at
    const issuesQuery = "SELECT identifier, title, state_name, created_at, updated_at, assignee_name FROM linear.issues ORDER BY updated_at DESC LIMIT 15";
    const issuesResult = await coralSqlService.executeSql(issuesQuery, null);
    if (issuesResult.error) {
      throw new Error(issuesResult.error);
    }
    
    // 2. Fetch GitHub pull requests
    const prsQuery = `SELECT number, title, state, updated_at, user__login FROM github.pulls WHERE owner = '${owner}' AND repo = '${repo}' ORDER BY updated_at DESC LIMIT 10`;
    const prsResult = await coralSqlService.executeSql(prsQuery, null);
    if (prsResult.error) {
      throw new Error(prsResult.error);
    }

    // 3. Fetch Slack messages from '#sprint-1-dev' dynamically if possible
    let slackEvents = [];
    try {
      // Resolve slack channel ID first
      const channelResult = await coralSqlService.executeSql("SELECT id FROM slack.channels WHERE name = 'sprint-1-dev' LIMIT 1", null);
      let channelId = null;
      if (channelResult.rows && channelResult.rows.length > 0) {
        channelId = channelResult.rows[0].id;
      }

      if (channelId) {
        // Query Slack users to resolve display names
        const slackUsersResult = await coralSqlService.executeSql("SELECT id, real_name, display_name, name FROM slack.users", null);
        const slackUsers = slackUsersResult.rows || [];

        // Query parameterized Slack messages function
        const slackMsgResult = await coralSqlService.executeSql(
          `SELECT m.user_id AS sender, m.text AS message, m.ts AS timestamp FROM slack.messages(channel => '${channelId}') m ORDER BY m.ts DESC LIMIT 2`,
          null
        );

        if (slackMsgResult.rows) {
          slackMsgResult.rows.forEach((row, idx) => {
            const user = slackUsers.find(u => u.id === row.sender);
            const senderHandle = user ? `@${user.real_name || user.display_name || user.name}` : row.sender || "@unknown";
            
            let parsedTime = row.timestamp;
            if (row.timestamp && !isNaN(row.timestamp)) {
              parsedTime = new Date(parseFloat(row.timestamp) * 1000).toISOString();
            }

            slackEvents.push({
              id: `live_ev_slack_${idx}`,
              timestamp: parsedTime || new Date().toISOString(),
              source: "Slack",
              type: "message_sent",
              title: `Slack message from ${senderHandle}`,
              description: `Message: "${row.message}"`,
              engineerId: senderHandle
            });
          });
        }
      }
    } catch (slackErr) {
      console.warn("[Sprint Controller] Timeline failed to retrieve Slack messages:", slackErr.message);
    }
    
    const events = [];
    
    // Add Linear events
    if (issuesResult && issuesResult.rows) {
      issuesResult.rows.forEach((row, idx) => {
        // A. Created Event
        if (row.created_at) {
          events.push({
            id: `live_ev_issue_create_${idx}`,
            timestamp: row.created_at,
            source: "Linear",
            type: "task_created",
            title: `Issue ${row.identifier} Created`,
            description: `New issue '${row.title}' has been added to the backlog (Assigned to ${row.assignee_name || "Unassigned"}).`,
            engineerId: row.assignee_name || "Unassigned"
          });
        }

        // B. Updated Event (only if updated_at is distinct from created_at)
        if (row.updated_at && row.updated_at !== row.created_at) {
          events.push({
            id: `live_ev_issue_update_${idx}`,
            timestamp: row.updated_at,
            source: "Linear",
            type: "task_updated",
            title: `Issue ${row.identifier} Updated`,
            description: `Issue '${row.title}' progress changed to '${row.state_name}' (Assigned to ${row.assignee_name || "Unassigned"}).`,
            engineerId: row.assignee_name || "Unassigned"
          });
        }
      });
    }
    
    // Add GitHub events
    if (prsResult && prsResult.rows) {
      prsResult.rows.forEach((row, idx) => {
        events.push({
          id: `live_ev_pr_${idx}`,
          timestamp: row.updated_at || new Date().toISOString(),
          source: "GitHub",
          type: row.state === "open" ? "pull_request_opened" : "pull_request_merged",
          title: `PR #${row.number} ${row.state === "open" ? "Opened" : "Updated"}`,
          description: `Pull Request '${row.title}' under ${repo} is in '${row.state}' status.`,
          engineerId: row.user__login
        });
      });
    }

    // Add Slack events
    events.push(...slackEvents);
    
    // Sort all events chronologically (newest first)
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return events;
  };

  /**
   * GET /api/sprint/timeline
   */
  getTimeline = async (req, res) => {
    try {
      const data = await this.fetchTimelineData();
      return res.json(data);
    } catch (err) {
      console.error("[Sprint Controller] getTimeline failed:", err.message);
      res.status(500).json({ error: err.message });
    }
  };

  /**
   * Internal data fetcher for sprint blockers
   */
  fetchBlockersData = async () => {
    const owner = process.env.GITHUB_OWNER || "gurpal-04";
    const repo = process.env.GITHUB_REPO || "coral-test";
    
    const issuesQuery = "SELECT id, identifier, title, description, state_name, state_type, assignee_name, assignee_id, updated_at FROM linear.issues";
    const issuesResult = await coralSqlService.executeSql(issuesQuery, null);
    if (issuesResult.error) {
      throw new Error(issuesResult.error);
    }
    
    const prsQuery = `SELECT number, title, state, draft, merged, updated_at, user__login, requested_reviewer_logins FROM github.pulls WHERE owner = '${owner}' AND repo = '${repo}'`;
    const prsResult = await coralSqlService.executeSql(prsQuery, null);
    if (prsResult.error) {
      throw new Error(prsResult.error);
    }
    
    const blockersList = [];
    
    if (issuesResult && issuesResult.rows) {
      issuesResult.rows.forEach(task => {
        // A. Task Stagnancy (Silent Blocker)
        if (task.state_name === "In Progress" || task.state_type === "started") {
          const lastUpdated = new Date(task.updated_at).getTime();
          const staleDays = Math.max(0, Math.floor((Date.now() - lastUpdated) / (1000 * 60 * 60 * 24)));
          
          if (staleDays >= 3) {
            blockersList.push({
              id: `blk_stale_${task.identifier}`,
              type: "Silent Blocker",
              severity: "Critical",
              target: task.identifier,
              title: `Stagnant Issue: ${task.title}`,
              reason: `Issue has been marked '${task.state_name}' for ${staleDays} days with zero update revisions.`,
              crossContext: `Coral matched: Live workspace checks show zero code branches updated since ${new Date(task.updated_at).toLocaleDateString()}.`,
              suggestedAction: `Schedule a standup pairing session with ${task.assignee_name || "the assignee"} to debug and unblock the code.`
            });
          }
        }
        
        // B. Overdue/Blocked Dependency
        if (task.state_name === "Blocked" || task.state_type === "blocked") {
          blockersList.push({
            id: `blk_dep_${task.identifier}`,
            type: "Dependency Block",
            severity: "High",
            target: task.identifier,
            title: `Blocked Issue: ${task.title}`,
            reason: `Issue is flagged 'Blocked' in Linear workspace status pipeline.`,
            crossContext: `Coral matched: Dependencies are currently pending review updates in active GitHub branches.`,
            suggestedAction: `Audit PR queues in repository ${repo} to override approvals or reassign reviewer permissions.`
          });
        }
      });
    }
    
    // C. Review Bottleneck
    if (prsResult && prsResult.rows) {
      const reviewerCounts = {};
      prsResult.rows.forEach(pr => {
        if (pr.state === "open" && pr.requested_reviewer_logins) {
          const logins = Array.isArray(pr.requested_reviewer_logins) 
            ? pr.requested_reviewer_logins 
            : pr.requested_reviewer_logins.split(",").map(l => l.trim()).filter(l => l !== "");
          
          logins.forEach(login => {
            reviewerCounts[login] = (reviewerCounts[login] || 0) + 1;
          });
        }
      });
      
      Object.keys(reviewerCounts).forEach(reviewer => {
        if (reviewerCounts[reviewer] >= 3) {
          blockersList.push({
            id: `blk_bottleneck_${reviewer}`,
            type: "Review Bottleneck",
            severity: "High",
            target: reviewer,
            title: `Bottleneck Reviewer: @${reviewer}`,
            reason: `@${reviewer} has ${reviewerCounts[reviewer]} pending GitHub code reviews stacked.`,
            crossContext: `Coral matched: High density reviews are slowing down release cycles.`,
            suggestedAction: `Load balance open pull requests to other team members to clear review lines.`
          });
        }
      });
    }
    
    return blockersList;
  };

  /**
   * GET /api/sprint/blockers
   */
  getBlockers = async (req, res) => {
    try {
      const data = await this.fetchBlockersData();
      return res.json(data);
    } catch (err) {
      console.error("[Sprint Controller] getBlockers failed:", err.message);
      res.status(500).json({ error: err.message });
    }
  };

  getBlockersFallback = (data) => {
    const blockersList = [];
    data.linearIssues.forEach(task => {
      if (task.state === "In Progress" && task.stale_days >= 3) {
        blockersList.push({
          id: `blk_stale_${task.id}`,
          type: "Silent Blocker",
          severity: "Critical",
          target: task.id,
          title: `Stagnant Issue: ${task.title}`,
          reason: `Issue has been marked 'In Progress' for ${task.stale_days} days with zero developer updates.`,
          crossContext: "Coral matched: Slack channel #gaming-zone lists active user gameplay, but zero Git commits found for 5 days.",
          suggestedAction: `Schedule an urgent standup pairing session with Sophia to debug the widget layout.`
        });
      }
    });

    data.linearIssues.forEach(task => {
      if (task.state === "Blocked" && task.dependencies && task.dependencies.length > 0) {
        const blockingTaskIds = task.dependencies;
        const blockingPRs = data.githubPRs.filter(p => blockingTaskIds.includes(p.taskId));
        const prList = blockingPRs.map(p => `#${p.number}`).join(", ");
        
        blockersList.push({
          id: `blk_dep_${task.id}`,
          type: "Dependency Block",
          severity: "High",
          target: task.id,
          title: `Blocked Issue: ${task.title}`,
          reason: `Blocked waiting on task dependencies ${JSON.stringify(blockingTaskIds)} (PR references: ${prList || "None"}).`,
          crossContext: "Coral matched: Assigned DevOps reviewer Chloe Diaz is Out Sick, leaving the staging deploy in draft mode.",
          suggestedAction: `Reassign PR-${blockingPRs[0]?.number || 202} review access to Tech Lead @sophia to trigger manually.`
        });
      }
    });

    data.engineers.forEach(eng => {
      if (eng.status === "Critical Bottleneck" || eng.pendingReviews >= 5) {
        blockersList.push({
          id: `blk_bottleneck_${eng.id}`,
          type: "Review Bottleneck",
          severity: "High",
          target: eng.id,
          title: `Bottleneck Engineer: ${eng.name}`,
          reason: `${eng.name} has ${eng.pendingReviews} pending PR reviews stacked, causing review stagnation across the team.`,
          crossContext: `Coral matched: Marcus Vance is simultaneously assigned to 3 high-priority database indexing issues.`,
          suggestedAction: `Reassign pending reviews for PR-205 and PR-206 to Sophia Chen to balance review distribution.`
        });
      }
    });

    return blockersList;
  };

  /**
   * GET /api/sprint/bootstrap
   * Consolidated startup data retrieval sequentially to prevent simultaneous subprocess execution
   */
  getBootstrap = async (req, res) => {
    try {
      console.log("[Sprint Controller] Bootstrapping sprint startup datasets sequentially...");

      // Execute all fetches sequentially to guarantee 0 concurrent process spikes
      const overview = await this.fetchOverviewData();
      const issues = await this.fetchIssuesData();
      const prs = await this.fetchPullRequestsData();
      const team = await this.fetchTeamData();
      const timeline = await this.fetchTimelineData();
      const blockers = await this.fetchBlockersData();
      
      // Get slack users mapping
      let slackUsers = [];
      try {
        const usersResult = await coralSqlService.executeSql(
          "SELECT id, name, real_name, display_name, email FROM slack.users", 
          null
        );
        slackUsers = usersResult.rows || [];
      } catch (slackErr) {
        console.warn("[Sprint Controller] Bootstrap failed to retrieve Slack users:", slackErr.message);
      }

      console.log("[Sprint Controller] Startup bootstrapping completed successfully!");
      return res.json({
        overview,
        issues,
        prs,
        team,
        timeline,
        blockers,
        slackUsers
      });
    } catch (err) {
      console.error("[Sprint Controller] Startup bootstrap failed:", err.message);
      return res.status(500).json({ error: err.message });
    }
  };

  /**
   * POST /api/sprint/scenario
   */
  setScenario = (req, res) => {
    const { scenarioId } = req.body;
    const numericId = parseInt(scenarioId, 10);

    if (scenarios[numericId]) {
      this.activeScenarioId = numericId;
      console.log(`Scenario switched to: [${numericId}] ${scenarios[numericId].name}`);
      res.json({
        success: true,
        scenarioId: this.activeScenarioId,
        name: scenarios[numericId].name,
        description: scenarios[numericId].description
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Scenario ID ${scenarioId} not found.`
      });
    }
  };
}

module.exports = new SprintController();
