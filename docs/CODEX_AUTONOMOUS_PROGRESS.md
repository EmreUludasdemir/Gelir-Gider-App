# Autonomous development progress

## 2026-11-24 — Duplicate PDF handling (BG-001)

- Baseline: default branch at `c29a20d` already included Dashboard 2.0 and a multi-PDF workbench. Open PR #10 covers dashboard performance. The default branch's CI/CD Pipeline passed and its E2E workflow failed.
- Decision: prioritize trust in statement imports. The workbench previously let users opt in to retrying files the API would reject and included those files in projected totals.
- Implemented: use the file hash returned by the existing preview API to identify additional copies in the same batch, including renamed copies. Both those copies and previously imported files remain visible with an explanation. They contribute no rows to the save request or preview totals. Confirmation is disabled when no eligible files remain.
- Research: [YNAB Spending Breakdown](https://support.ynab.com/en_us/spending-breakdown-H1H7YxmD0) and [Spending Trends](https://support.ynab.com/en_us/spending-trends-H1inlhzAc) expose which entries drive spending totals. The workbench applies that principle to the files and rows eligible to be saved.
- Verification: web lint, TypeScript, production build and Jest, including component regression tests for a mixed batch and a duplicate-only batch. Playwright could not start local Chromium because the environment denied socket creation. The browser smoke flow remains to be verified in CI.
- Next: keep edited rows for failed files after partial confirmation and retry only those files. Add coverage for a partial success followed by a successful retry.
