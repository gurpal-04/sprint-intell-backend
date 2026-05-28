import { env } from "../config/env";
import { httpRequest } from "../utils/http.util";

interface CoralSqlResponse {
  rows: Record<string, unknown>[];
}

export class CoralQueryService {
  private readonly endpoint = `${env.CORAL_BASE_URL}/sql`;

  private async query(sql: string): Promise<Record<string, unknown>[]> {
    const data = await httpRequest<CoralSqlResponse>({
      method: "POST",
      url: this.endpoint,
      headers: {
        Authorization: `Bearer ${env.CORAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      data: { query: sql },
      timeout: 20000,
    });

    return data.rows ?? [];
  }

  async getCurrentSprintIssues(): Promise<Record<string, unknown>[]> {
    return this.query(`
      SELECT *
      FROM linear.issues
      WHERE sprint_status = 'active'
      ORDER BY priority DESC, updated_at DESC
      LIMIT 500;
    `);
  }

  async getIssueFullContext(issueId: string): Promise<Record<string, unknown>[]> {
    return this.query(`
      SELECT i.id, i.title, i.status, pr.number as pr_number, pr.state as pr_state,
             s.text as slack_text, c.title as doc_title
      FROM linear.issues i
      LEFT JOIN github.pulls pr ON pr.branch_name = i.branch_name
      LEFT JOIN slack.messages s ON s.text LIKE '%' || i.identifier || '%'
      LEFT JOIN confluence.pages c ON c.title LIKE '%' || i.identifier || '%'
      WHERE i.id = '${issueId}'
      LIMIT 200;
    `);
  }

  async getBlockedIssues(): Promise<Record<string, unknown>[]> {
    return this.query(`
      SELECT *
      FROM linear.issues
      WHERE status = 'blocked'
      ORDER BY updated_at DESC
      LIMIT 200;
    `);
  }

  async getIssuesInReview(): Promise<Record<string, unknown>[]> {
    return this.query(`
      SELECT i.*, pr.number as pr_number, pr.created_at as pr_created_at
      FROM linear.issues i
      JOIN github.pulls pr ON pr.branch_name = i.branch_name
      WHERE i.status = 'in_review'
      ORDER BY pr.created_at ASC
      LIMIT 300;
    `);
  }

  async getStaleIssues(): Promise<Record<string, unknown>[]> {
    return this.query(`
      SELECT *
      FROM linear.issues
      WHERE updated_at < NOW() - INTERVAL '3 days'
      AND status NOT IN ('done', 'canceled')
      ORDER BY updated_at ASC
      LIMIT 300;
    `);
  }

  async getIssueSlackThreads(issueId: string): Promise<Record<string, unknown>[]> {
    return this.query(`
      SELECT m.*
      FROM slack.messages m
      JOIN linear.issues i ON m.text LIKE '%' || i.identifier || '%'
      WHERE i.id = '${issueId}'
      ORDER BY m.ts DESC
      LIMIT 100;
    `);
  }

  async getIssueDocs(issueId: string): Promise<Record<string, unknown>[]> {
    return this.query(`
      SELECT c.*
      FROM confluence.pages c
      JOIN linear.issues i ON c.title LIKE '%' || i.identifier || '%'
      WHERE i.id = '${issueId}'
      ORDER BY c.last_modified DESC
      LIMIT 50;
    `);
  }
}

export const coralQueryService = new CoralQueryService();
