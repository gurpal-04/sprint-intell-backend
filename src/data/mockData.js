// rich mock dataset representing the Sprint 24 ecosystem with native Linear schema.
const engineers = [
  {
    id: "eng_sophia",
    name: "Sophia Chen",
    handle: "@sophia",
    role: "Tech Lead",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    workloadScore: 40,
    activeTasks: 2,
    pendingReviews: 1,
    status: "Healthy",
    bio: "Focused on system architecture, code health, and unblocking team paths."
  },
  {
    id: "eng_marcus",
    name: "Marcus Vance",
    handle: "@marcus",
    role: "Senior Backend Engineer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    workloadScore: 95,
    activeTasks: 4,
    pendingReviews: 6,
    status: "Overloaded",
    bio: "Owns the core API layer, database migrations, and Coral retrieval connectors."
  },
  {
    id: "eng_leo",
    name: "Leo Russo",
    handle: "@leo",
    role: "Frontend Engineer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    workloadScore: 60,
    activeTasks: 2,
    pendingReviews: 0,
    status: "Healthy",
    bio: "Fascinated by high-performance React charts, custom styling, and micro-interactions."
  },
  {
    id: "eng_emma",
    name: "Emma Watson",
    handle: "@emma",
    role: "QA Engineer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    workloadScore: 50,
    activeTasks: 2,
    pendingReviews: 1,
    status: "Healthy",
    bio: "Automation testing, performance profiling, and manual regression checks."
  },
  {
    id: "eng_chloe",
    name: "Chloe Diaz",
    handle: "@chloe",
    role: "DevOps Engineer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    workloadScore: 30,
    activeTasks: 1,
    pendingReviews: 1,
    status: "Healthy",
    bio: "Kubernetes, CI/CD pipelines, staging environments, and deployment stability."
  }
];

const linearIssues = [
  {
    id: "LIN-101",
    title: "Implement Coral Retrieval Connector Service",
    state: "In Progress",
    priority: "Urgent",
    assignee_id: "eng_marcus",
    estimate: 8,
    due_date: "2026-05-26",
    start_date: "2026-05-20",
    description: "Build semantic search indices connecting raw Linear issues and Slack channels to the retrieval engine.",
    dependencies: [],
    last_activity: "2026-05-24T10:00:00Z",
    stale_days: 0
  },
  {
    id: "LIN-102",
    title: "Integrate Gemini API Ingestion Controller",
    state: "Review",
    priority: "High",
    assignee_id: "eng_marcus",
    estimate: 5,
    due_date: "2026-05-25",
    start_date: "2026-05-21",
    description: "Orchestrate express routes with streaming gemini-2.0 response parameters.",
    dependencies: ["LIN-101"],
    last_activity: "2026-05-23T16:30:00Z",
    stale_days: 1
  },
  {
    id: "LIN-103",
    title: "Develop Dark-Mode Glassmorphism Dashboard Layout",
    state: "Done",
    priority: "Normal",
    assignee_id: "eng_leo",
    estimate: 3,
    due_date: "2026-05-22",
    start_date: "2026-05-18",
    description: "Design sleek SaaS sidebar layouts and visual container cards matching Linear aesthetics.",
    dependencies: [],
    last_activity: "2026-05-22T18:00:00Z",
    stale_days: 2
  },
  {
    id: "LIN-104",
    title: "Build Event Correlation Timeline Widget",
    state: "In Progress",
    priority: "High",
    assignee_id: "eng_leo",
    estimate: 5,
    due_date: "2026-05-27",
    start_date: "2026-05-22",
    description: "Draw vertical visual connectors linking github branch updates and Slack mentions.",
    dependencies: ["LIN-102"],
    last_activity: "2026-05-24T14:45:00Z",
    stale_days: 0
  },
  {
    id: "LIN-105",
    title: "Automate E2E Regression Checks for Sprint 24",
    state: "In Progress",
    priority: "Normal",
    assignee_id: "eng_emma",
    estimate: 5,
    due_date: "2026-05-28",
    start_date: "2026-05-23",
    description: "Write playwright/cypress checks auditing user flow regressions across active charts.",
    dependencies: ["LIN-103"],
    last_activity: "2026-05-24T12:00:00Z",
    stale_days: 0
  },
  {
    id: "LIN-106",
    title: "Deploy Staging CI/CD Build System V2",
    state: "Review",
    priority: "Normal",
    assignee_id: "eng_chloe",
    estimate: 3,
    due_date: "2026-05-25",
    start_date: "2026-05-22",
    description: "Transition standard GitHub action templates to high-velocity caching containers.",
    dependencies: [],
    last_activity: "2026-05-24T09:00:00Z",
    stale_days: 0
  },
  {
    id: "LIN-107",
    title: "Audit Database Index Constraints & Multi-Tenancy Rules",
    state: "In Progress",
    priority: "High",
    assignee_id: "eng_sophia",
    estimate: 8,
    due_date: "2026-05-26",
    start_date: "2026-05-20",
    description: "Establish composite index rules optimizing lookups across tenant queries.",
    dependencies: [],
    last_activity: "2026-05-24T15:30:00Z",
    stale_days: 0
  },
  {
    id: "LIN-108",
    title: "Create User Profile Settings & Integration Connectors",
    state: "In Progress",
    priority: "Normal",
    assignee_id: "eng_leo",
    estimate: 3,
    due_date: "2026-05-29",
    start_date: "2026-05-24",
    description: "Toggle active enterprise systems, adjust workspace credentials, and input API keys.",
    dependencies: [],
    last_activity: "2026-05-24T16:15:00Z",
    stale_days: 0
  }
];

const githubPRs = [
  {
    id: "PR-201",
    number: 201,
    title: "feat(coral): implement vector-search index initialization service",
    repo: "enterprise-api",
    status: "Open",
    draft: false,
    authorId: "eng_marcus",
    reviewers: ["eng_sophia"],
    approved: false,
    taskId: "LIN-101",
    linesAdded: 450,
    linesRemoved: 24,
    createdDate: "2026-05-22T10:00:00Z",
    updatedDate: "2026-05-24T09:45:00Z",
    staleHours: 48,
    comments: [
      { author: "@sophia", text: "Are vector dimensions hardcoded or configurable?", time: "2026-05-23T11:00:00Z" }
    ]
  },
  {
    id: "PR-202",
    number: 202,
    title: "feat(gemini): connect chat orchestrator endpoint with context integration",
    repo: "enterprise-api",
    status: "Open",
    draft: false,
    authorId: "eng_marcus",
    reviewers: ["eng_sophia", "eng_leo"],
    approved: false,
    taskId: "LIN-102",
    linesAdded: 210,
    linesRemoved: 12,
    createdDate: "2026-05-23T14:00:00Z",
    updatedDate: "2026-05-23T16:30:00Z",
    staleHours: 24,
    comments: []
  },
  {
    id: "PR-203",
    number: 203,
    title: "ui(dashboard): dark-mode glassmorphic layouts & custom scrollbars",
    repo: "operations-dashboard",
    status: "Merged",
    draft: false,
    authorId: "eng_leo",
    reviewers: ["eng_sophia"],
    approved: true,
    taskId: "LIN-103",
    linesAdded: 780,
    linesRemoved: 140,
    createdDate: "2026-05-19T09:00:00Z",
    updatedDate: "2026-05-22T18:00:00Z",
    staleHours: 0,
    comments: []
  },
  {
    id: "PR-204",
    number: 204,
    title: "ci(deploy): update deployment actions with parallel container layers",
    repo: "ops-infrastructure",
    status: "Open",
    draft: false,
    authorId: "eng_chloe",
    reviewers: ["eng_marcus"],
    approved: false,
    taskId: "LIN-106",
    linesAdded: 88,
    linesRemoved: 42,
    createdDate: "2026-05-24T08:30:00Z",
    updatedDate: "2026-05-24T09:00:00Z",
    staleHours: 9,
    comments: []
  }
];

const slackLogs = [
  {
    channel: "#sprint-24-dev",
    sender: "@marcus",
    message: "Hey @sophia, I just pushed the PR for vector indices (PR-201). Mind giving it a quick look? It's key to testing the AI layer.",
    timestamp: "2026-05-22T10:15:00Z"
  },
  {
    channel: "#sprint-24-dev",
    sender: "@sophia",
    message: "Sure @marcus, I'm auditing database index rules right now, but will review this afternoon.",
    timestamp: "2026-05-22T11:05:00Z"
  },
  {
    channel: "#sprint-24-dev",
    sender: "@leo",
    message: "The dashboard design layout is merged (PR-203)! Let me know if you run into any visual glitches. Starting the timeline correlation widget next.",
    timestamp: "2026-05-22T18:10:00Z"
  },
  {
    channel: "#sprint-24-dev",
    sender: "@marcus",
    message: "Pushed Gemini endpoint PR too (PR-202). I have 4 PRs open waiting for reviews. Can anyone help review the small DB indices audit?",
    timestamp: "2026-05-23T16:45:00Z"
  },
  {
    channel: "#sprint-24-dev",
    sender: "@sophia",
    message: "Team, I am running a bit behind on review queues today. If anyone has bandwidth, please review Marcus's DB changes.",
    timestamp: "2026-05-24T09:30:00Z"
  }
];

module.exports = {
  engineers,
  linearIssues,
  githubPRs,
  slackLogs
};
