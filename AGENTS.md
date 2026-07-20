# Repository Agent Rules

These rules are mandatory for all agent work in this repository.

1. **Reuse skills already loaded in the current chat.** If a skill has already been read and understood during this chat, do not read or load it again for every subsequent change. Reload it only when the skill changed or its instructions are no longer available in the conversation context.

2. **Keep verification proportional to the change.** Do not run linters, TypeScript checks, builds, or similar broad verification for minor or small changes. Run them only when the user explicitly requests them or the agreed scope specifically requires them.

3. **Tests require an explicit request.** Do not write or run unit, integration, or end-to-end tests unless the user specifically asks for them.

4. **Stay strictly within the requested scope.** Do not implement additional ideas, refactors, cleanup, behavior changes, or unrelated improvements. If an additional change may be useful, describe it or ask for approval before changing code.

5. **Do not assume missing requirements.** Inspect, audit, and verify the available code and design sources. If a material requirement cannot be established from evidence, ask the user before implementing it.

6. **Prioritize evidence over agreement.** Do not agree merely to be pleasant. Communicate concrete findings, constraints, disagreements, and tradeoffs directly and professionally.
