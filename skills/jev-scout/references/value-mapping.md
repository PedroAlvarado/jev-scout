# Mapping the system and its value chain

Start from where value is won or lost, not from where the code calls a model. A code scan finds the judgments someone already wrote down; the value chain also shows the judgments made by a default, a fixed ordering, a person, or nobody.

## Sources in an ordinary repository

Read only what you need. Most of these exist in some form in any product repository:

| Source | What it tells you |
| --- | --- |
| `README*`, `docs/`, architecture notes, ADRs | What the system is for, its main parts, and why some things are done the way they are |
| Package manifests and deploy config | What kind of system it is (web app, API, worker, CLI, mobile, data pipeline), and which AI SDKs it already uses |
| Routes, pages, screens, CLI commands | The user flows |
| API handlers and webhooks | What outside systems send in and what they expect back |
| Jobs, queues, schedulers, cron config | Background work and its volume (schedule × batch size) |
| Database schemas and migrations | The core entities; the text-bearing columns are where judgments can happen |
| Billing, pricing, payments, plans | How the business earns; what users pay for |
| Analytics events (`track(`, `capture(`, `logEvent(`, `analytics.`) | Which moments the team measures, which usually means which moments matter |
| Metrics (counters, histograms, SLO definitions) | Operational goals: latency, throughput, error rates |
| Feature flags and experiments | What the team is unsure about and testing |
| Notifications, emails, messages | What the system tells users, and when |
| Admin, back-office, moderation and support tools | Where people do judgment work by hand |
| Config thresholds and constants | Tuned cutoffs, limits and scores |

## Building the product model

Write a short internal model:

- primary users and operators
- the core job the system does for them
- the main flows
- expensive or latency-sensitive AI paths
- high-volume items: messages, records, documents, candidates, events, agent steps
- places where people review, approve, sort or correct by hand
- the business levers: revenue or conversion, retention or experience, AI unit cost, operations throughput, latency, reliability or trust, and differentiated capability

## Building the value chain

List the steps from a user's first contact to the value they get and the value the business keeps. For each step, fill one row:

| Step | Who acts | Metric it moves | Judgments made here | Decided today by | Where in code | Volume hint |
| --- | --- | --- | --- | --- | --- | --- |
| Ticket arrives | Customer | First-response time | Which queue; is it urgent | Model; keyword rule | `src/triage/` | Every inbound message |
| Agent replies | Support agent | Resolution time, CSAT | Which help article to attach | First search hit | `src/kb/suggest.ts` | Every ticket |

"Decided today by" is one of: a model, a rule, first match or fixed order, a fixed cutoff, a default for everyone, a person, or nobody.

## Where the unmade decisions hide

Look deliberately for judgments that nobody makes today. They are invisible to a scan for model calls, and they are where augmentation and new-capability ideas come from:

- **Defaults for everyone:** the same order, message, pacing or options for every user.
- **Fixed orderings:** newest first, alphabetical, by price - when relevance would serve the user better.
- **Top-N and samples:** only the first page, the top five, or a random sample is ever looked at.
- **End-only checks:** quality is checked at publish, at checkout or at the end of a run, never along the way.
- **Unchecked actions:** a click, a send, a write, or a tool call that nobody verifies.
- **Human bottlenecks:** every item goes to a person, including the obvious ones.
- **Questions to users:** the product asks for something it could reasonably infer or pre-fill - only where the domain allows inference.
- **Unused text:** free-text fields that are stored and never read: notes, comments, descriptions, reasons, transcripts.

## Rules

- Do not invent revenue, traffic, conversion, volumes or costs. A number appears only with its source (a config value, a schedule, a schema, a doc) or as an explicit order-of-magnitude estimate with its derivation.
- Missing baselines become rows in **Measurements to collect**.
- Keep the value chain short: 5-10 steps is usually enough. The goal is to see where judgments sit, not to document the product.
