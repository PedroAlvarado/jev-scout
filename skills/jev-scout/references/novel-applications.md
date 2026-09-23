# Finding new capabilities

Substitutions are the easiest opportunities to see: there is already a model call or a keyword rule, and Jev can do its job. They are rarely the largest. The larger opportunities usually come from decisions the system never makes today, because making them on every item, every step or every user was too slow or too expensive with a large model, and too brittle with rules.

This page gives a method for finding them in any repository. Pair it with the live use-case map (`https://docs.typesafe.ai/concepts/use-case-map.md`) and the cookbooks listed in `https://docs.typesafe.ai/llms.txt`: pick the industry and task categories closest to the system and adapt their example decisions.

## Method

Take each step of the value chain and each high-volume item the system holds (messages, tickets, listings, documents, records, events, sessions, agent steps, search results, users). For each pair, ask the lenses below. Write down every idea that produces a concrete decision, then anchor it.

## Lenses

1. **Every item, not a sample.** Where does the system or its team look at a sample, the top page, or nothing at all? Judge every item: every listing, every conversation, every log line, every result.
2. **Every step, not the end.** Where does a check run only at publish, checkout, submit or the end of a run? Check after every edit, every step, every tool call.
3. **Every user, not the average.** Where does everyone get the same default order, message, pace or option? Decide per user and per interaction.
4. **Before the expensive thing.** What costs money or attention: a large model call, a person, a paid API, a slow job, a notification? Decide first whether it is needed, or which variant is needed.
5. **After another AI.** Where does the system trust another model's output, extraction or tool call? Verify it on every call: support, policy, format, intent, safety.
6. **In real time.** Where would a decision inside an interactive loop (typing, search as you type, an agent acting on a page, a game) change the experience if it came back fast enough?
7. **Over the history.** What text has the system accumulated and never read: old tickets, reviews, notes, traces, logs? Run judgments across it to find patterns, backfill labels, clean data or create features.
8. **Features for existing models.** Is there a ranking, forecasting, pricing or fraud model fed only structured data? Add probabilistic semantic features from the free text next to it.
9. **Continuous hygiene.** Where do duplicates, stale records, contradictions between free text and structured fields, or drift build up? Decide continuously in the background instead of in occasional cleanups.
10. **Pre-annotated human work.** Where do people review queues item by item? Sort the queue so people see only the uncertain slice, with the reason attached.
11. **Infer instead of asking - where allowed.** Where does the product ask users for something it could suggest or pre-fill from what it already knows? Only where the domain permits inference, and as a suggestion the user confirms; never invent facts about a real person where the rules forbid it.
12. **Semantic checks in the development workflow.** Does the team enforce conventions, writing guidelines or policy by review comments? A typed check in CI can enforce them on every change.

## Anchor every idea

A new-capability candidate is ranked only when it has all of these:

- **Value-chain step** it serves, and the metric it should move.
- **Unit and data:** the single item judged, and where its data already exists (a file, a table, an event, a field).
- **Integration point:** the file or symbol where the result would be consumed, and what behavior changes.
- **Why not today:** the cost, latency, brittleness or missing capability that kept the system from doing it.
- **Primitive sketch:** Choice, Noul or Score, and the question in one sentence.
- **Risk:** what a wrong answer costs, and the data sensitivity of the state.

Ideas that lack an anchor go to **Ideas to explore** in the report, unranked, with what would be needed to anchor them.

## Scoring new capabilities fairly

New capabilities have no current pain in the code, so score them on the value they would add:

- **current_friction** scores the value missed today (users who get a worse experience, work that is never done), not the pain of existing code.
- **evidence_strength** scores the anchor: data and integration point confirmed in code (4-5), plausible but unconfirmed (2-3), speculative (0-1).

## Anti-patterns

- An idea with no data source in the repository. Jev needs state to judge.
- A "decision" that is really generation (writing text, planning, coding).
- A decision that grants permissions or moves money on its own. Jev may inform such a step; code and people decide it.
- A capability that needs a product change nobody has asked for, with no value-chain step it improves.
- Novelty for its own sake: the report must say what the capability is worth and how to test it cheaply.

## Generic examples

- **Support desk:** judge frustration and churn risk on every inbound message (lens 1) and route the risky ones to senior agents; verify every drafted reply against the refund policy before it is sent (lens 5).
- **Marketplace:** extract typed attributes and policy flags for every listing, not only reported ones (lenses 1 and 9); detect listings whose description contradicts their category or price (lens 9).
- **SaaS onboarding:** pick the next nudge per user from their first-session events and free-text answers (lens 3).
- **Agent harness:** check each tool call against the user's stated intent before executing it (lens 5), and choose the element to click when a selector matches several (lens 6).
- **Data pipeline:** flag records whose free-text notes contradict their structured fields as they arrive (lenses 7 and 9).
