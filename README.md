# Enterprise Sprint Health Dashboard Backend

Production-grade backend for Engineering Operations Intelligence using:
- Coral for cross-source enterprise retrieval and normalization
- Groq for AI reasoning, blocker detection, and recommendations

## Architecture

Frontend -> Express API -> Coral Query Layer -> Linear/GitHub/Slack/Confluence

Groq AI Insight Engine consumes structured context retrieved from Coral.

## Key Separation

- Coral is used only for querying, joins, and unified retrieval.
- Groq is used only for summarization, blocker/risk analysis, and recommendations.

## Setup

1. Copy env file:
   - `cp .env.example .env`
2. Install deps:
   - `npm install`
3. Generate Prisma client:
   - `npx prisma generate`
4. Run migrations:
   - `npx prisma migrate dev --name init`
5. Start dev server:
   - `npm run dev`

## API Endpoints

- `GET /api/dashboard/overview`
- `GET /api/dashboard/blockers`
- `GET /api/dashboard/insights`
- `GET /api/issues/:id/context`
- `GET /api/issues/stale`
- `GET /api/sprints/current`
- `POST /api/auth/login`

All dashboard endpoints are JWT-protected.

## Sample Coral Query

```sql
SELECT i.id, i.title, i.status, pr.number
FROM linear.issues i
LEFT JOIN github.pulls pr ON pr.branch_name = i.branch_name
WHERE i.sprint_status = 'active';
```

## Sample Groq Reasoning Flow

1. Retrieve normalized context via Coral service.
2. Build structured prompt from context.
3. Send prompt to Groq (`llama-3.3-70b-versatile`).
4. Return JSON insights for dashboard cards and drilldowns.

## Background Jobs

- Refresh Coral context and dashboard snapshots every 15 minutes.
- Regenerate sprint insights and store AI history in `AIInsight`.

## Notes

- External enterprise data is not duplicated in DB beyond cache/snapshot/analytics.
- Prisma models include `User`, `Sprint`, `IssueCache`, `DashboardSnapshot`, and `AIInsight`.
