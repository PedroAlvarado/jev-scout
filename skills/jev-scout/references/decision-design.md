# Designing implementation-ready Jev decisions

## Core model

Jev supplies fast typed judgments. Application code owns control flow, exact computation, policy, permissions, side effects, and final user-visible prose.

A good Jev question is usually one a knowledgeable person could answer quickly if given the right evidence and a small answer space.

## Work backward from the consumer

Before drafting a question, identify the exact branch in code:

- choose one route -> Choice
- independently decide whether a condition holds -> Noul
- measure degree along a concrete ordered scale -> Score

Do not ask "What should we do?" if the real consumer needs three independent facts. Ask the three facts and compose them in code.

## State

Include only evidence that materially changes the judgment:

- the current item
- short domain/business context
- relevant user/account/workflow state
- available candidate labels/actions and their meanings
- recent events or errors when they matter

Keep trusted policy/rules separate from untrusted user/page/log content. Do not send secrets. If evidence is missing, represent that explicitly rather than encouraging guessing.

## Questions

Each question should have:

- a narrow target
- a clear decision boundary
- concrete criteria
- missing/unknown behavior when appropriate

Bad: `Is this request important?`

Better: `Does this request describe a production outage currently blocking paying customers?`

Bad: `How good is this lead?`

Better Score levels:

1. no stated need or authority
2. relevant problem but no evidence of active buying intent
3. active evaluation with a plausible use case
4. concrete buying process, authority, and near-term need

## Choice

Use for one winner among mutually exclusive alternatives. Include a no-match/unknown option unless candidate coverage is guaranteed.

Choice probabilities compare competing alternatives. Do not use one Choice when multiple labels may all apply.

## Noul

Use for one yes/no proposition. The probability is the signal. Around 0.5 means uncertain, not "medium."

For multi-label classification or multi-item retrieval, ask one Noul per independently applicable property/candidate and let code collect positives.

## Score

Use for a real ordered dimension. Prefer 2-10 levels with concrete operational descriptions. Scores should be comparable when used to rank items.

Do not force unordered categories onto a Score.

## Batch independent questions

Questions that share state and do not depend on one another should go in one request. This reduces repeated state and latency.

Use a second request when an earlier answer is needed to fetch additional evidence, construct candidates, or define the next question.

## Uncertainty and failure

Design the unknown path before the happy path:

- missing evidence -> unknown / review / fetch evidence
- low confidence or mid-range Noul -> review or stronger model
- timeout / API failure -> preserve current behavior or safe fallback
- malformed response -> do not silently coerce into an action

Thresholds should be tuned on labeled examples and consequences, not copied from demos.

## Safe composition

Jev is not an authorization boundary. For irreversible or sensitive actions:

- deterministic code verifies permissions and policy
- Jev may recommend or select only from already legal candidates
- uncertain results escalate
- side effects occur only after normal application checks

## Evaluation cases

Label boundary cases, not only obvious examples:

- semantically similar but policy-different cases
- empty/ambiguous input
- conflicting evidence
- prompt-injection-like text inside untrusted content
- multiple acceptable alternatives
- false-positive categories that would be costly
- service failure and stale-state cases

When a result is wrong, diagnose whether the cause is missing evidence, question design, model error, composition code, or service failure before changing thresholds.
