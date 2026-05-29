/**
 * Correlation Service - Correlates multi-system logs (Linear, GitHub, Slack)
 * to build unified timeline narratives.
 */
class CorrelationService {
  /**
   * Generates a correlated event stream based on the active scenario.
   * @param {number} scenarioId The active scenario ID.
   * @param {Object} data Active scenario data.
   * @returns {Array} List of correlated events with source, type, and timeline details.
   */
  getCorrelatedTimeline(scenarioId, data) {
    const timeline = [];

    if (scenarioId === 1) {
      // Scenario 1: Stuck dependency timeline
      timeline.push(
        {
          id: "ev1_1",
          timestamp: "2026-05-23T14:00:00Z",
          source: "GitHub",
          type: "pull_request_opened",
          title: "PR #202 Opened",
          description: "Marcus Vance opened PR #202: 'feat(gemini): connect chat orchestrator endpoint'",
          engineerId: "eng_marcus",
          link: "PR-202",
          badge: "Open"
        },
        {
          id: "ev1_2",
          timestamp: "2026-05-24T09:30:00Z",
          source: "Slack",
          type: "message",
          title: "#sprint-24-dev request",
          description: "@sophia posted: 'Team, I am running a bit behind on review queues today. If anyone has bandwidth, please review Marcus's DB changes.'",
          engineerId: "eng_sophia",
          channel: "#sprint-24-dev"
        },
        {
          id: "ev1_3",
          timestamp: "2026-05-24T10:15:00Z",
          source: "Slack",
          type: "message",
          title: "#sprint-24-dev blocked inquiry",
          description: "@sophia pinged DevOps: '@chloe are you around? We really need that staging pipeline deployment updated so we can merge PR-202.'",
          engineerId: "eng_sophia",
          channel: "#sprint-24-dev"
        },
        {
          id: "ev1_4",
          timestamp: "2026-05-24T10:30:00Z",
          source: "Slack",
          type: "sick_notice",
          title: "DevOps Sick Notice",
          description: "@chloe posted: 'Hey team, sorry I'm actually out sick today. Woke up with a high fever. Will try to review first thing tomorrow morning...'",
          engineerId: "eng_chloe",
          channel: "#sprint-24-dev",
          severity: "Medium"
        },
        {
          id: "ev1_5",
          timestamp: "2026-05-24T11:00:00Z",
          source: "Slack",
          type: "message",
          title: "Marcus Overloaded Update",
          description: "@marcus posted: 'Extremely overloaded today... Won't have bandwidth to jump on deployment configs.'",
          engineerId: "eng_marcus",
          channel: "#sprint-24-dev"
        },
        {
          id: "ev1_6",
          timestamp: "2026-05-24T16:15:00Z",
          source: "Linear",
          type: "task_blocked",
          title: "Issue Blocked",
          description: "Sophia's task 'Create User Profile Settings & Integration Connectors' (LIN-108) changed status to 'Blocked' by system rules due to stuck dependency LIN-102.",
          engineerId: "eng_sophia",
          link: "LIN-108",
          severity: "High"
        }
      );
    } else if (scenarioId === 2) {
      // Scenario 2: Post-deployment regression incident
      timeline.push(
        {
          id: "ev2_1",
          timestamp: "2026-05-22T18:00:00Z",
          source: "GitHub",
          type: "pull_request_merged",
          title: "PR #203 Merged",
          description: "Leo Russo merged PR #203: 'ui(dashboard): dark-mode glassmorphic layouts & custom scrollbars'",
          engineerId: "eng_leo",
          link: "PR-203",
          badge: "Merged"
        },
        {
          id: "ev2_2",
          timestamp: "2026-05-22T18:05:00Z",
          source: "Slack",
          type: "deployment_success",
          title: "Staging Deploy Success",
          description: "@github-actions announced: '[ALERT] Vercel deployment of operations-dashboard completed successfully. Commit: 9e24a10.'",
          channel: "#ops-alerts"
        },
        {
          id: "ev2_3",
          timestamp: "2026-05-24T16:05:00Z",
          source: "Slack",
          type: "error_triggered",
          title: "Staging Broken Alert",
          description: "TypeError: Cannot read properties of undefined (reading 'avatar') at App.jsx:42. Staging app crashed in user session.",
          channel: "#ops-alerts",
          severity: "Critical"
        },
        {
          id: "ev2_4",
          timestamp: "2026-05-24T16:10:00Z",
          source: "Slack",
          type: "incident_alert",
          title: "#sprint-24-dev incident thread",
          description: "@chloe posted: '@leo @sophia we have a major crash spike in staging after the deployment! 1200+ errors in 5 mins. Looks like the custom avatar component you merged in PR-203.'",
          engineerId: "eng_chloe",
          channel: "#sprint-24-dev"
        },
        {
          id: "ev2_5",
          timestamp: "2026-05-24T16:15:00Z",
          source: "Slack",
          type: "message",
          title: "Root Cause Identified",
          description: "@leo posted: 'Oh no! Looking now. I think the API returns null profiles for new users, and my avatar component tries to access user.profile.avatar directly without optional chaining.'",
          engineerId: "eng_leo",
          channel: "#sprint-24-dev"
        },
        {
          id: "ev2_6",
          timestamp: "2026-05-24T16:20:00Z",
          source: "Slack",
          type: "message",
          title: "Rollback Ordered",
          description: "@sophia posted: 'Let's roll back that deployment, or push a hotfix immediately. @leo, write a patch. @chloe, prepare to build staging.'",
          engineerId: "eng_sophia",
          channel: "#sprint-24-dev"
        }
      );
    } else if (scenarioId === 3) {
      // Scenario 3: Review bottleneck timeline
      timeline.push(
        {
          id: "ev3_1",
          timestamp: "2026-05-23T09:00:00Z",
          source: "GitHub",
          type: "pull_request_opened",
          title: "PR #205 Opened",
          description: "Sophia Chen opened PR #205: 'feat(auth): add MFA authorization token checks'",
          engineerId: "eng_sophia",
          link: "PR-205"
        },
        {
          id: "ev3_2",
          timestamp: "2026-05-23T11:00:00Z",
          source: "GitHub",
          type: "pull_request_opened",
          title: "PR #206 Opened",
          description: "Emma Watson opened PR #206: 'test(e2e): mock testing auth state containers'",
          engineerId: "eng_emma",
          link: "PR-206"
        },
        {
          id: "ev3_3",
          timestamp: "2026-05-23T16:45:00Z",
          source: "Slack",
          type: "message",
          title: "Marcus Alert",
          description: "@marcus posted: 'Pushed Gemini endpoint PR too (PR-202). I have 4 PRs open waiting for reviews. Can anyone help review the small DB indices audit?'",
          engineerId: "eng_marcus",
          channel: "#sprint-24-dev"
        },
        {
          id: "ev3_4",
          timestamp: "2026-05-24T09:30:00Z",
          source: "Slack",
          type: "message",
          title: "Sophia Audit Request",
          description: "@sophia requested reviews: 'Team, I am running a bit behind on review queues today. If anyone has bandwidth, please review Marcus's DB changes.'",
          engineerId: "eng_sophia",
          channel: "#sprint-24-dev"
        },
        {
          id: "ev3_5",
          timestamp: "2026-05-24T11:15:00Z",
          source: "Slack",
          type: "message",
          title: "QA Blocked Query",
          description: "@emma posted: 'Any updates on PR-206 review @marcus? Tests are ready to go but I need the API endpoints mock validated.'",
          engineerId: "eng_emma",
          channel: "#sprint-24-dev"
        },
        {
          id: "ev3_6",
          timestamp: "2026-05-24T11:30:00Z",
          source: "Slack",
          type: "message",
          title: "Bottleneck Explained",
          description: "@marcus posted: 'Sorry Emma, I am buried under active developments and reviews. I have 6 reviews in my inbox...'",
          engineerId: "eng_marcus",
          channel: "#sprint-24-dev",
          severity: "High"
        }
      );
    } else if (scenarioId === 4) {
      // Scenario 4: Silent blocker timeline
      timeline.push(
        {
          id: "ev4_1",
          timestamp: "2026-05-19T09:00:00Z",
          source: "Linear",
          type: "task_started",
          title: "Issue In Progress",
          description: "Leo Russo marked issue 'Build Event Correlation Timeline Widget' (LIN-104) as 'In Progress'.",
          engineerId: "eng_leo",
          link: "LIN-104"
        },
        {
          id: "ev4_2",
          timestamp: "2026-05-23T10:00:00Z",
          source: "Slack",
          type: "message",
          title: "Sophia Check-In #1",
          description: "@sophia posted: 'Hey @leo, how is the event correlation widget coming along? Do you need any backend helper endpoints...?'",
          engineerId: "eng_sophia",
          channel: "#sprint-24-dev"
        },
        {
          id: "ev4_3",
          timestamp: "2026-05-24T09:00:00Z",
          source: "Slack",
          type: "message",
          title: "Sophia Check-In #2 (Unanswered)",
          description: "@sophia posted: 'Checking in again @leo. We need the timeline visualization ready for qa by tomorrow. Let us know if you are stuck.'",
          engineerId: "eng_sophia",
          channel: "#sprint-24-dev",
          severity: "Low"
        },
        {
          id: "ev4_4",
          timestamp: "2026-05-24T14:00:00Z",
          source: "Slack",
          type: "gaming_update",
          title: "Activity in #gaming-zone",
          description: "@leo posted: 'Anyone down for a Valorant match tonight? Just unlocked the new agent skin!'",
          engineerId: "eng_leo",
          channel: "#gaming-zone",
          severity: "Medium"
        },
        {
          id: "ev4_5",
          timestamp: "2026-05-24T17:00:00Z",
          source: "System",
          type: "silent_blocker_flagged",
          title: "Silent Blocker Alert Flagged",
          description: "SYSTEM detected critical stagnancy: Issue LIN-104 has been in progress for 5 days with zero commits, no pull request drafts, and unanswered Slack inquiries.",
          severity: "High"
        }
      );
    } else {
      // Default / Scenario 5 (Standup generator/broad correlation timeline)
      timeline.push(
        {
          id: "ev5_1",
          timestamp: "2026-05-22T18:00:00Z",
          source: "GitHub",
          type: "pull_request_merged",
          title: "PR #203 Merged",
          description: "Leo Russo merged PR #203: 'ui(dashboard): dark-mode glassmorphic layouts & custom scrollbars'",
          engineerId: "eng_leo",
          link: "PR-203"
        },
        {
          id: "ev5_2",
          timestamp: "2026-05-23T14:00:00Z",
          source: "GitHub",
          type: "pull_request_opened",
          title: "PR #202 Opened",
          description: "Marcus Vance opened PR #202: 'feat(gemini): connect chat orchestrator endpoint'",
          engineerId: "eng_marcus",
          link: "PR-202"
        },
        {
          id: "ev5_3",
          timestamp: "2026-05-24T09:00:00Z",
          source: "Linear",
          type: "task_updated",
          title: "Deploy Staging Issue Updated",
          description: "Chloe Diaz moved issue 'Deploy Staging CI/CD Build System V2' (LIN-106) into Review.",
          engineerId: "eng_chloe",
          link: "LIN-106"
        },
        {
          id: "ev5_4",
          timestamp: "2026-05-24T14:45:00Z",
          source: "Linear",
          type: "task_updated",
          title: "Timeline Issue Update",
          description: "Leo Russo logs progress on 'Build Event Correlation Timeline Widget' (LIN-104) in In Progress.",
          engineerId: "eng_leo",
          link: "LIN-104"
        },
        {
          id: "ev5_5",
          timestamp: "2026-05-24T15:30:00Z",
          source: "Linear",
          type: "task_updated",
          title: "Database Constraints Update",
          description: "Sophia Chen logged task activity on 'Audit Database Index Constraints' (LIN-107).",
          engineerId: "eng_sophia",
          link: "LIN-107"
        }
      );
    }

    return timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
}

module.exports = new CorrelationService();
