# Knowledge-First Rule — Designer Agent

## RULE
Always consult the knowledge base in `designer/knowledge/` before answering design questions.

## Protocol
1. **Check existing patterns first** — read designer/knowledge/README.md for the index
2. **If pattern exists** — reference it, add context for the specific question
3. **If pattern is new** — answer the question, then document the pattern in designer/knowledge/
4. **If pattern contradicts existing** — flag the contradiction, investigate, update knowledge

## Pattern documentation format
Each pattern file in designer/knowledge/ should include:
- **Pattern name** — clear, descriptive title
- **Where observed** — which services/countries use this pattern
- **How it works** — technical description with component IDs when available
- **Why it exists** — the business reason behind the design
- **Gotchas** — common mistakes or edge cases
- **Related patterns** — links to other patterns that interact with this one

## Growing the knowledge base
- After every service analysis: check if new patterns were discovered
- After cross-service comparison: document shared patterns
- After a design question is answered: if the answer was non-trivial, document it
- Periodically update designer/knowledge/README.md with new entries
