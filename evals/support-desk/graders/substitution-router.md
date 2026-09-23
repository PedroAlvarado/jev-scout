---
# The report proposes a Jev Choice for the LLM ticket router and names src/triage/router.ts
# near it. Deterministic, because judge models misread long reports that rank it low.
type: regex
target: last_message
flags: i
pattern: 'router\.ts[\s\S]{0,400}\bchoice\b|\bchoice\b[\s\S]{0,400}router\.ts'
---
