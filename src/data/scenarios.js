const baseData = require("./mockData");

const scenarios = {
  1: {
    id: 1,
    name: "Sprint Delayed: Dependency Stuck in Review",
    description: "Sophia Chen is blocked on dashboard settings because Marcus's API PR is stuck waiting for DevOps review. Chloe is out sick today, postponing staging deployments.",
    engineers: baseData.engineers.map(eng => {
      if (eng.id === "eng_chloe") return { ...eng, status: "Out Sick", workloadScore: 0 };
      if (eng.id === "eng_marcus") return { ...eng, workloadScore: 98, status: "Overloaded" };
      return eng;
    }),
    linearIssues: baseData.linearIssues.map(task => {
      if (task.id === "LIN-108") {
        return {
          ...task,
          state: "Blocked",
          dependencies: ["LIN-102"],
          description: "Blocked waiting on Gemini ingestion controllers and endpoint definitions (PR-202) to be merged."
        };
      }
      return task;
    }),
    githubPRs: baseData.githubPRs.map(pr => {
      if (pr.id === "PR-202") {
        return {
          ...pr,
          reviewers: ["eng_chloe", "eng_sophia"],
          updatedDate: "2026-05-23T14:00:00Z",
          staleHours: 27
        };
      }
      return pr;
    }),
    slackLogs: [
      ...baseData.slackLogs,
      {
        channel: "#sprint-24-dev",
        sender: "@sophia",
        message: "@chloe are you around? We really need that staging pipeline deployment updated so we can merge PR-202 and unblock settings development.",
        timestamp: "2026-05-24T10:15:00Z"
      },
      {
        channel: "#sprint-24-dev",
        sender: "@chloe",
        message: "Hey team, sorry I'm actually out sick today. Woke up with a high fever. Will try to review first thing tomorrow morning, or @marcus can override if needed.",
        timestamp: "2026-05-24T10:30:00Z"
      },
      {
        channel: "#sprint-24-dev",
        sender: "@sophia",
        message: "Get well soon, Chloe! @marcus can you take a look, or is your plate full?",
        timestamp: "2026-05-24T10:45:00Z"
      },
      {
        channel: "#sprint-24-dev",
        sender: "@marcus",
        message: "Extremely overloaded today. Fixing the database index lookups and finishing vector embeddings. Won't have bandwidth to jump on deployment configs.",
        timestamp: "2026-05-24T11:00:00Z"
      }
    ]
  },

  2: {
    id: 2,
    name: "Deployment Incident: Staging Broken",
    description: "Immediately following Chloe's staging container update deployment, the team reports a frontend crash tied to Leo's profile styling commits.",
    engineers: baseData.engineers.map(eng => {
      if (eng.id === "eng_chloe") return { ...eng, status: "Investigating Incident", workloadScore: 85 };
      if (eng.id === "eng_leo") return { ...eng, status: "Under Stress", workloadScore: 80 };
      return eng;
    }),
    linearIssues: baseData.linearIssues.map(task => {
      if (task.id === "LIN-103") {
        return {
          ...task,
          state: "Blocked",
          description: "Production Regression Alert detected. Investigate avatar styling layout errors."
        };
      }
      return task;
    }),
    githubPRs: baseData.githubPRs.map(pr => {
      if (pr.id === "PR-203") {
        return {
          ...pr,
          status: "Merged",
          updatedDate: "2026-05-24T16:00:00Z"
        };
      }
      return pr;
    }),
    slackLogs: [
      ...baseData.slackLogs,
      {
        channel: "#ops-alerts",
        sender: "@github-actions",
        message: "[CRITICAL ALERT] Staging build failed. TypeError: Cannot read properties of undefined (reading 'avatar') at App.jsx:42. Action required.",
        timestamp: "2026-05-24T16:05:00Z"
      },
      {
        channel: "#sprint-24-dev",
        sender: "@chloe",
        message: "@leo @sophia we have a major crash spike in staging after the deployment! Looks like the custom avatar component you merged in PR-203.",
        timestamp: "2026-05-24T16:10:00Z"
      },
      {
        channel: "#sprint-24-dev",
        sender: "@leo",
        message: "Oh no! Looking now. I think the API returns null profiles for new users, and my avatar component tries to access user.profile.avatar directly without optional chaining.",
        timestamp: "2026-05-24T16:15:00Z"
      },
      {
        channel: "#sprint-24-dev",
        sender: "@sophia",
        message: "Let's roll back that deployment, or push a hotfix immediately. @leo, write a patch. @chloe, prepare to build staging.",
        timestamp: "2026-05-24T16:20:00Z"
      }
    ]
  },

  3: {
    id: 3,
    name: "Review Bottleneck: Marcus Assigned 6 Open PRs",
    description: "Marcus has become a bottleneck, holding 6 pending code reviews while managing 3 high-point backend tasks. Delivery health is dropping rapidly due to review stale rates.",
    engineers: baseData.engineers.map(eng => {
      if (eng.id === "eng_marcus") return { ...eng, workloadScore: 100, status: "Critical Bottleneck", pendingReviews: 6 };
      return eng;
    }),
    linearIssues: baseData.linearIssues.map(task => {
      if (task.assignee_id === "eng_marcus") {
        return { ...task, last_activity: "2026-05-22T08:00:00Z", stale_days: 2 };
      }
      return task;
    }),
    githubPRs: [
      ...baseData.githubPRs,
      {
        id: "PR-205",
        number: 205,
        title: "feat(auth): add MFA authorization token checks",
        repo: "enterprise-api",
        status: "Open",
        draft: false,
        authorId: "eng_sophia",
        reviewers: ["eng_marcus"],
        approved: false,
        taskId: "LIN-107",
        linesAdded: 150,
        linesRemoved: 5,
        createdDate: "2026-05-23T09:00:00Z",
        updatedDate: "2026-05-23T09:00:00Z",
        staleHours: 32,
        comments: []
      },
      {
        id: "PR-206",
        number: 206,
        title: "test(e2e): mock testing auth state containers",
        repo: "operations-dashboard",
        status: "Open",
        draft: false,
        authorId: "eng_emma",
        reviewers: ["eng_marcus"],
        approved: false,
        taskId: "LIN-105",
        linesAdded: 94,
        linesRemoved: 2,
        createdDate: "2026-05-23T11:00:00Z",
        updatedDate: "2026-05-23T11:00:00Z",
        staleHours: 30,
        comments: []
      }
    ],
    slackLogs: [
      ...baseData.slackLogs,
      {
        channel: "#sprint-24-dev",
        sender: "@emma",
        message: "Any updates on PR-206 review @marcus? Tests are ready to go but I need the API endpoints mock validated.",
        timestamp: "2026-05-24T11:15:00Z"
      },
      {
        channel: "#sprint-24-dev",
        sender: "@marcus",
        message: "Sorry Emma, I am buried under active developments and reviews. I have 6 reviews in my inbox and two urgent backend issues to solve. Will try my best tonight.",
        timestamp: "2026-05-24T11:30:00Z"
      },
      {
        channel: "#sprint-24-dev",
        sender: "@sophia",
        message: "I will take over PR-205 to help unblock things, but @marcus is definitely our primary pipeline constraint today. We need to distribute knowledge better.",
        timestamp: "2026-05-24T11:45:00Z"
      }
    ]
  },

  4: {
    id: 4,
    name: "Silent Blocker: In-Progress Task Stagnancy",
    description: "Leo Russo has been working on a complex timeline widget (LIN-104) for 5 consecutive days. In Linear, it is marked 'In Progress', but there are zero git commits, zero PR drafts, no slack updates, and high activity in off-topic channels.",
    engineers: baseData.engineers,
    linearIssues: baseData.linearIssues.map(task => {
      if (task.id === "LIN-104") {
        return {
          ...task,
          last_activity: "2026-05-19T09:00:00Z",
          stale_days: 5,
          description: "Build timeline layout. High risk: zero code revisions pushed for 5 days. Critical to showing event correlations."
        };
      }
      return task;
    }),
    githubPRs: baseData.githubPRs.filter(pr => pr.taskId !== "LIN-104"),
    slackLogs: [
      ...baseData.slackLogs.filter(log => log.sender !== "@leo"),
      {
        channel: "#sprint-24-dev",
        sender: "@sophia",
        message: "Hey @leo, how is the event correlation widget coming along? Do you need any backend helper endpoints from @marcus?",
        timestamp: "2026-05-23T10:00:00Z"
      },
      {
        channel: "#sprint-24-dev",
        sender: "@sophia",
        message: "Checking in again @leo. We need the timeline visualization ready for qa by tomorrow. Let us know if you are stuck.",
        timestamp: "2026-05-24T09:00:00Z"
      },
      {
        channel: "#gaming-zone",
        sender: "@leo",
        message: "Anyone down for a Valorant match tonight? Just unlocked the new agent skin!",
        timestamp: "2026-05-24T14:00:00Z"
      }
    ]
  },

  5: {
    id: 5,
    name: "Standup Generator: Rapid Progress Aggregation",
    description: "Perfect workflow demonstrating cross-tool activity correlation. The AI reads raw task logs, commits, merges, and reviews to formulate a perfect standup update for Sophia and Marcus.",
    engineers: baseData.engineers,
    linearIssues: baseData.linearIssues,
    githubPRs: baseData.githubPRs,
    slackLogs: baseData.slackLogs
  }
};

module.exports = scenarios;
