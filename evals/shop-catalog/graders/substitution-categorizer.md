---
# The report proposes a Jev Choice for the LLM categorizer and names catalog/categorize.py
# near it. Deterministic, because judge models misread long reports that rank it low.
type: regex
target: last_message
flags: i
pattern: 'categorize\.py[\s\S]{0,400}\bchoice\b|\bchoice\b[\s\S]{0,400}categorize\.py'
---
