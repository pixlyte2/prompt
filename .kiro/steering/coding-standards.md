---
inclusion: always
---

# Coding Standards — Project Turtle

## Code Philosophy
Write code as if the next person to read it has never seen this project. Simplicity is the highest virtue — clever code is a liability, clear code is an asset.

## TypeScript Rules
- Files: kebab-case (`cheerio-parse.ts`, `content-node.service.ts`)
- Types/Interfaces: PascalCase (`ContentNode`, `AgentDecision`)
- Functions: camelCase, verb-first (`parseHtmlContent`, `detectCmsType`)
- Booleans: prefix with is/has/should/can
- Constants: SCREAMING_SNAKE (`MAX_RETRY_ATTEMPTS`)
- NEVER use `any` — use `unknown` and narrow with type guards
- Define return types explicitly on all exported functions
- Use Zod for runtime validation of external inputs (API requests, LLM responses)
- Functions do ONE thing, stay under 30 lines
- Early returns over nested if/else
- Prefer `const` and pure functions over mutable state

## Comments — Explain WHY, Not WHAT
- JSDoc on all exported functions with @param and @returns
- Document business logic and non-obvious decisions
- Never comment what code does — comment why

## Error Handling
- NEVER swallow errors silently — log at minimum, throw if appropriate
- Use standard error classes from `packages/core/utils/errors.ts` (TurtleError, HttpError, TimeoutError, AgentError)
- Always include context: what failed, what input caused it, whether retryable
- try/catch at boundaries (API handlers, tool execute), not deep in logic

## Database
- All queries MUST include project_id filter (enforced by Prisma middleware)
- Use `select` to fetch only needed fields — never bare `findMany()`
- Batch inserts: `createMany()` for bulk operations
- Add indexes for any field used in WHERE or ORDER BY

## Frontend
- Tailwind CSS classes only — no inline styles, no custom CSS files
- Components lazy-loaded per route (`React.lazy` + `Suspense`)
- `next/image` with explicit dimensions for all images
- Lists over 100 items use virtualization

## Testing — REQUIRED For Every File
- Every `.ts` file gets a `.test.ts` file alongside it
- Vitest with vi.mock() for externals — never hit real URLs or databases
- Arrange → Act → Assert pattern
- Coverage targets: Tools 90%+, Services 80%+, UI 60%+

## Self-Review Before PR
- All acceptance criteria from ADO task met
- Unit tests written AND passing (`pnpm test`)
- No TypeScript errors (`pnpm typecheck`)
- No `any` types anywhere
- JSDoc on all exported functions
- Error handling uses standard TurtleError classes
- Database queries include project_id scoping
