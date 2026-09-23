---
type: llm
weight: 2
---
PASS if the final report proposes at least one new capability the code does not do today, anchored to a specific file, field or data source in this repository, and says what it would improve. Examples that qualify: extracting typed attributes or policy flags for every listing's title and description; detecting listings whose description contradicts their category or price; scoring dispute risk from listing text against the disputes metric in the README; turning review text into features for search ranking.
FAIL if every proposal only replaces or checks existing code paths, or if no new idea names its data, its integration point and why it is not done today.
