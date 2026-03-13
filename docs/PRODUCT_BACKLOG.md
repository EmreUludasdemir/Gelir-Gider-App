# Product Backlog

## How to Use This Backlog
This file is designed to translate product direction into executable work.

Each item includes:
- priority: `P0`, `P1`, `P2`, or `P3`
- impact: user and business value
- effort: estimated implementation difficulty
- dependencies: what should exist first
- acceptance criteria: what must be true before closing the item

## Priority Definitions
- `P0`: highest product value and immediate roadmap work
- `P1`: strong value, depends on P0 or ongoing stabilization
- `P2`: important platform and quality work
- `P3`: strategic or longer-horizon expansion

## Epic 1: Import Experience

### BG-001 - Multi-PDF Import Review Flow
- Priority: `P0`
- Impact: high
- Effort: medium
- Dependencies: upload preview and confirm APIs
- Goal: allow multiple bank statement PDFs to be uploaded, reviewed, and confirmed in a single workflow
- Acceptance criteria:
  - user can queue multiple PDFs in one action
  - each file shows parse status, duplicate state, and confidence signals
  - user can confirm all clean files in one action
  - duplicate files are clearly marked and do not create silent duplicate transactions
  - upload flow has passing web smoke coverage

### BG-002 - Editable Import Preview
- Priority: `P0`
- Impact: high
- Effort: medium
- Dependencies: BG-001
- Goal: let the user correct parsed rows before saving
- Acceptance criteria:
  - description, date, amount, type, and category are editable before save
  - low-confidence rows are visibly highlighted
  - deleted rows are excluded from final save
  - final review summarizes saved rows and review-needed rows

### BG-003 - Parse Confidence and Review Signals
- Priority: `P0`
- Impact: high
- Effort: medium
- Dependencies: BG-002
- Goal: make the parser trustworthy by exposing where the system is uncertain
- Acceptance criteria:
  - each parsed row has a confidence signal
  - suspicious rows are labeled as `Guvenli`, `Incele`, or `Supheli`
  - aggregate quality score is shown at file and batch level
  - test cases cover low-confidence scenarios

### BG-004 - Import Preview Corrections Learning Loop
- Priority: `P1`
- Impact: medium-high
- Effort: high
- Dependencies: BG-002, BG-010
- Goal: use user corrections to improve future categorization
- Acceptance criteria:
  - user corrections are stored in a reusable rules model
  - repeated merchants benefit from learned suggestions
  - AI remains fallback, not the default path

## Epic 2: Dashboard and Analysis

### BG-005 - Dashboard 2.0 Summary Surface
- Priority: `P0`
- Impact: high
- Effort: medium
- Dependencies: existing dashboard summary endpoints
- Goal: make the dashboard the primary decision screen
- Acceptance criteria:
  - shows current month income, expense, and net balance
  - shows delta vs previous month
  - shows top spending categories
  - shows upcoming bills and budget pressure
  - layout works on desktop and mobile

### BG-006 - Financial Analysis Board
- Priority: `P0`
- Impact: high
- Effort: medium
- Dependencies: BG-005
- Goal: highlight patterns instead of only totals
- Acceptance criteria:
  - shows category pressure
  - shows recurring load
  - shows cash buffer or runway signal
  - shows where spending accelerated the most
  - shows at least one cutback recommendation

### BG-007 - Cash Flow Forecast
- Priority: `P1`
- Impact: medium-high
- Effort: medium
- Dependencies: bills, subscriptions, and transaction trends
- Goal: estimate likely end-of-month balance
- Acceptance criteria:
  - salary days and recurring charges influence the forecast
  - expected upcoming bills are included
  - forecast explains what inputs shaped the estimate

### BG-008 - Financial Health Score
- Priority: `P2`
- Impact: medium-high
- Effort: medium
- Dependencies: BG-005, BG-006, BG-007
- Goal: compress financial status into a single interpretable score
- Acceptance criteria:
  - score reflects savings rate, expense pressure, recurring load, and budget usage
  - score explanation is visible in UI
  - score never appears without explanation

## Epic 3: Subscription Intelligence

### BG-009 - Subscription Center
- Priority: `P0`
- Impact: high
- Effort: medium
- Dependencies: recurring payment detection
- Goal: separate subscriptions from generic transactions
- Acceptance criteria:
  - recurring merchants are grouped
  - monthly subscription total is visible
  - upcoming renewals are visible
  - user can confirm or dismiss a suggested subscription

### BG-010 - Recurring Payment Detection
- Priority: `P0`
- Impact: high
- Effort: medium-high
- Dependencies: clean transaction history
- Goal: detect repeating charges using amount, merchant, and cadence
- Acceptance criteria:
  - recurring candidates are generated automatically
  - detection tolerates small amount variation
  - false positives can be dismissed by the user
  - confirmed recurring merchants feed future suggestions

### BG-011 - Cancellation Candidate Suggestions
- Priority: `P1`
- Impact: medium
- Effort: low-medium
- Dependencies: BG-009, BG-010
- Goal: identify subscriptions worth reviewing
- Acceptance criteria:
  - suggestions are based on usage or overlap heuristics
  - suggestions are framed as review prompts, not hard claims

## Epic 4: Smart Transaction Management

### BG-012 - Bulk Transaction Editing
- Priority: `P0`
- Impact: high
- Effort: medium
- Dependencies: transaction list filters
- Goal: reduce manual cleanup time
- Acceptance criteria:
  - user can select multiple transactions
  - category, type, and tags can be updated in bulk
  - action is reflected immediately in UI and API responses

### BG-013 - Similar Transaction Categorization
- Priority: `P0`
- Impact: high
- Effort: medium
- Dependencies: BG-012, BG-014
- Goal: apply one correction to many similar rows
- Acceptance criteria:
  - similar merchant or description clusters are suggested
  - user can apply a category to a whole cluster
  - cluster logic is deterministic and testable

### BG-014 - Hybrid Category Engine
- Priority: `P1`
- Impact: high
- Effort: high
- Dependencies: merchant rules, user correction storage
- Goal: improve accuracy while controlling AI cost
- Acceptance criteria:
  - deterministic rule engine runs before AI
  - AI is only invoked when confidence is below threshold
  - categorization response includes reason metadata

## Epic 5: Explainable AI and Insights

### BG-015 - Explainable Category Decisions
- Priority: `P1`
- Impact: medium-high
- Effort: medium
- Dependencies: BG-014
- Goal: show why the system selected a category
- Acceptance criteria:
  - explanation references a rule, merchant match, or model rationale
  - explanation is visible where the categorization result is shown

### BG-016 - Anomaly Detection Expansion
- Priority: `P1`
- Impact: medium-high
- Effort: medium
- Dependencies: richer historical analysis
- Goal: catch meaningful outliers, not only raw spikes
- Acceptance criteria:
  - flags unusual amount changes
  - flags dense bursts of small purchases
  - flags forgotten subscriptions
  - each anomaly has a short explanation

### BG-017 - Monthly Finance Coach
- Priority: `P1`
- Impact: medium-high
- Effort: medium
- Dependencies: BG-006, BG-016
- Goal: provide a monthly summary with prioritized recommendations
- Acceptance criteria:
  - coach output includes summary, risks, and 3 recommendations
  - recommendations reference underlying transaction behavior
  - system degrades gracefully if AI is unavailable

## Epic 6: Production and Quality

### BG-018 - Parser PDF Corpus Tests
- Priority: `P2`
- Impact: high
- Effort: medium
- Dependencies: curated sample PDF set
- Goal: avoid regressions in bank statement parsing
- Acceptance criteria:
  - real sample PDFs exist for supported formats
  - parser tests verify normalized row output and confidence metadata

### BG-019 - AI Regression Test Suite
- Priority: `P2`
- Impact: medium-high
- Effort: medium
- Dependencies: stable AI prompts and fixtures
- Goal: keep AI-assisted outputs consistent enough for production
- Acceptance criteria:
  - fixtures exist for parse, insight, and anomaly prompts
  - tests catch prompt drift and contract breaks

### BG-020 - Audit Log and Security Visibility
- Priority: `P2`
- Impact: medium-high
- Effort: high
- Dependencies: user/session context in API
- Goal: improve operational trust and traceability
- Acceptance criteria:
  - critical actions are audit logged
  - failed login attempts are visible to operators
  - session management view exists for users or admins

### BG-021 - Monitoring and Recovery Playbook
- Priority: `P2`
- Impact: medium
- Effort: medium
- Dependencies: deployment pipeline maturity
- Goal: reduce operational surprises in production
- Acceptance criteria:
  - core health checks are documented
  - backup and restore steps are documented and tested
  - production config validation exists before deploy

## Epic 7: Longer-Horizon Product Expansion

### BG-022 - Shared Budget Mode
- Priority: `P3`
- Impact: medium
- Effort: high
- Dependencies: permission and data ownership model
- Goal: support couples or shared households
- Acceptance criteria:
  - multiple users can contribute to shared budgets
  - ownership boundaries remain clear

### BG-023 - Premium Packaging and Monetization
- Priority: `P3`
- Impact: strategic
- Effort: medium
- Dependencies: stronger product differentiation
- Goal: define what would belong in free vs premium tiers
- Acceptance criteria:
  - premium feature candidates are listed
  - AI usage limits and export/reporting limits are modeled

## Suggested GitHub Issue Format
Use titles like:
- `feat(import): add confidence-driven multi-pdf review flow`
- `feat(dashboard): add month-over-month spending analysis board`
- `feat(subscriptions): detect recurring merchants and renewal load`
- `feat(ai): explain category decisions with hybrid rule metadata`
- `chore(parser): add regression corpus for supported bank pdf formats`

## Recommended Immediate Sprint
1. BG-001 Multi-PDF Import Review Flow
2. BG-003 Parse Confidence and Review Signals
3. BG-005 Dashboard 2.0 Summary Surface
4. BG-009 Subscription Center
5. BG-012 Bulk Transaction Editing
