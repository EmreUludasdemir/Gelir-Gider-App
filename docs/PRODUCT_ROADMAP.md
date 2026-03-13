# Product Roadmap

## Product Thesis
Gelir-Gider App should evolve from a generic expense tracker into a PDF-first personal finance assistant.

Core positioning:
- imports bank statements from PDF
- turns raw transactions into clean, editable financial data
- explains spending patterns with actionable analysis
- helps users reduce waste, manage subscriptions, and reach savings goals

## Current Baseline
The repo already has a strong foundation:
- `apps/web`: Next.js web app
- `apps/api`: NestJS API
- `services/pdf-parser`: FastAPI PDF parser
- PostgreSQL + Redis + Docker-based local stack
- AI endpoints for insights, anomalies, and chat
- cookie-based auth for the web client
- dashboard, upload flow, subscription and forecast surfaces already started

This roadmap focuses on productization, not broad rewrites.

## Guiding Principles
1. Start from user-visible value.
2. Prefer low-risk improvements over large architectural churn.
3. Use rule-based systems before AI when the same result can be achieved deterministically.
4. Every feature must have a clear success metric and an acceptance path.
5. Features that improve trust in imported financial data come before cosmetic expansion.

## Now / Next / Later
### Now
- import review and correction workflow
- dashboard depth and comparison metrics
- subscription intelligence
- transaction productivity improvements

### Next
- explainable AI
- hybrid category engine
- anomaly detection expansion
- monthly finance coach

### Later
- audit log
- background jobs
- shared/family mode
- production operations and monitoring enhancements

## Release Plan

### Phase 1: High-Impact Product Value
Target: make the app feel materially smarter and easier to trust.

#### 1. Import Studio
Goal:
Turn PDF import into a guided review workflow instead of a blind ingestion step.

Scope:
- editable import preview
- confidence score per row
- low-confidence and duplicate warnings
- batch import for multiple PDFs
- bulk apply category and type changes
- post-import review with quality summary

Success metrics:
- lower manual correction time
- higher import completion rate
- fewer incorrectly categorized imported rows

#### 2. Dashboard 2.0
Goal:
Make the first screen immediately useful for decisions.

Scope:
- monthly income vs expense summary
- delta vs previous month
- top spending categories
- upcoming bills
- budget pressure and risk cards
- cash flow forecast
- savings progress and recurring load

Success metrics:
- higher dashboard revisit rate
- more direct navigation from dashboard to corrective actions

#### 3. Subscription Center
Goal:
Expose recurring charges and turn them into clear monthly cost decisions.

Scope:
- detect recurring merchants and subscriptions
- monthly subscription total
- upcoming subscription renewals
- merchant grouping
- cancellation candidate hints

Success metrics:
- more subscriptions confirmed by the user
- lower recurring expense after review cycles

#### 4. Transaction Productivity
Goal:
Reduce repetitive cleanup work after import or manual entry.

Scope:
- bulk edit transactions
- smart category suggestions based on merchant and description
- apply same category to similar transactions
- recurring payment suggestions
- stronger transaction filters

Success metrics:
- fewer clicks per cleanup session
- higher category consistency across similar records

### Phase 2: Intelligence Layer
Target: turn the cleaned data into trustworthy guidance.

#### 5. Explainable AI
Scope:
- explain why a category was chosen
- explain why a transaction is anomalous
- expose model confidence and fallback behavior
- show the rule or pattern that influenced the outcome when possible

#### 6. Hybrid Categorization Engine
Scope:
- merchant rules
- regex and keyword rules
- user correction memory
- AI fallback only when deterministic matching is weak

#### 7. Anomaly Detection Expansion
Scope:
- unusual amount vs user baseline
- burst of many small expenses in a short period
- forgotten subscriptions
- unexpected merchant/category shifts

#### 8. Monthly Finance Coach
Scope:
- monthly summary
- 3 high-value recommendations
- risk highlights
- savings opportunities

Success metrics for Phase 2:
- increased usage of AI surfaces
- reduced category correction rate
- higher user engagement with recommendation cards

### Phase 3: Production Maturity
Target: support scale, traceability, and operational safety.

#### 9. Background Jobs
Scope:
- async PDF parsing
- report generation
- monthly analysis jobs
- reminder emails or notifications

#### 10. Audit and Security
Scope:
- audit log for critical mutations
- failed login tracking
- session management screen
- PII masking tests
- production config validation

#### 11. Quality and Operations
Scope:
- parser corpus with real PDF samples
- AI regression tests
- API contract tests
- more end-to-end coverage
- monitoring and backup/restore playbooks

## Recommended Priority Order
1. Import Studio
2. Subscription Center
3. Dashboard 2.0
4. Transaction Productivity
5. Hybrid Categorization
6. Explainable AI
7. Monthly Finance Coach
8. Production maturity items

## Success Metrics
Track these over time:
- import completion rate
- manual correction rate after import
- subscription detection confirmation rate
- dashboard engagement rate
- anomaly card interaction rate
- month-over-month savings improvement for active users

## Delivery Notes
- Keep web, API, and parser work loosely coupled by feature slices.
- Stabilize tests for each release slice before moving to the next phase.
- Any AI feature should have a deterministic fallback path.
- Any financial insight exposed in UI should be traceable to raw transaction data.
