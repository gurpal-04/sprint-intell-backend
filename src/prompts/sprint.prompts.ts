export const sprintInsightPrompt = (context: unknown): string => `
Analyze the following sprint engineering data and return STRICT JSON with keys:
summary, blockers, staleIssues, reviewBottlenecks, recommendations, sprintHealthScore.

Rules:
- Identify blockers, stale tickets, review bottlenecks, missing documentation, sprint risks.
- Keep output concise and operationally actionable.
- sprintHealthScore must be 0-100 integer.

Data:
${JSON.stringify(context)}
`;
