# Autonomous development progress

## 2026-11-24 — Duplicate PDF handling (BG-001)

- Baseline: default branch at `c29a20d` already included Dashboard 2.0 and a multi-PDF workbench. Open PR #10 covers dashboard performance. The default branch's CI/CD Pipeline passed and its E2E workflow failed.
- Decision: prioritize trust in statement imports. The workbench previously let users opt in to retrying files the API would reject and included those files in projected totals.
- Implemented: use the file hash returned by the existing preview API to identify additional copies in the same batch, including renamed copies. Both those copies and previously imported files remain visible with an explanation. They contribute no rows to the save request or preview totals. Confirmation is disabled when no eligible files remain.
- Research: [YNAB Spending Breakdown](https://support.ynab.com/en_us/spending-breakdown-H1H7YxmD0) and [Spending Trends](https://support.ynab.com/en_us/spending-trends-H1inlhzAc) expose which entries drive spending totals. The workbench applies that principle to the files and rows eligible to be saved.
- Verification: web lint, TypeScript, production build and Jest, including component regression tests for a mixed batch and a duplicate-only batch. Playwright could not start local Chromium because the environment denied socket creation. The browser smoke flow remains to be verified in CI.
- Next: keep edited rows for failed files after partial confirmation and retry only those files. Add coverage for a partial success followed by a successful retry.

## 2026-11-26 — Recoverable batch confirmation (BG-001)

- Baseline: draft PR #11 remains open. Its CI/CD pipeline passed and E2E failed, as it did on the default branch. This iteration builds on its duplicate filter.
- Decision: preserve corrections after a partial save. The API currently writes rows and the PDF marker separately, so an interrupted response may follow a write.
- Implemented: keep failed files and their edited rows in the workbench. Retry only confirmed pre-write rejections. Show an explicit status for unverified outcomes and retain a cumulative result by file hash. Pause edits while saving and require finishing or discarding the active review before starting a new upload.
- Research: [YNAB file-based import](https://support.ynab.com/en_us/file-based-import-a-guide-Bkj4Sszyo) describes skipping already imported entries. This flow likewise keeps saved files out of subsequent submissions.
- Verification: web lint, TypeScript, production build and 32 Jest tests passed. The workbench regression covers saved, retryable and unverified files in the same batch. Local Playwright could not launch Chromium.
- Next: make confirmation safe to retry after a connection loss by keeping saved rows and their file marker consistent. Preserve the existing per-row error reporting, and verify the browser smoke flow in CI.
