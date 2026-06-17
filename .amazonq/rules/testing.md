# Testing Patterns

## Framework
Vitest â€” fast, TypeScript-native, Jest-compatible API.

## Every File Gets a Test File
```
packages/core/agents/scrape-agent/tools/cheerio-parse.ts
packages/core/agents/scrape-agent/tools/cheerio-parse.test.ts  â† ALWAYS
```

## Pattern: Arrange â†’ Act â†’ Assert
```typescript
describe('toolName', () => {
  it('describes the expected behavior', async () => {
    // Arrange â€” set up mocks and inputs
    const mockHtml = '<html>...</html>';
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(mockHtml));

    // Act â€” call the function
    const result = await tool.execute({ url: 'https://example.com' });

    // Assert â€” verify the outcome
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Expected');
  });
});
```

## What to Test per Module
- **Tools:** execute() with valid input, invalid input, network errors, empty responses
- **Agent logic:** Guardrail triggers (max iterations, token budget), state transitions
- **Services:** CRUD operations, edge cases (duplicate, not found, unauthorized)
- **tRPC procedures:** Happy path + RBAC enforcement (viewer blocked, editor allowed)
- **Utils:** Retry logic, error classification, data transformations

## Mocking Rules
- `vi.mock()` for modules, `vi.fn()` for functions
- NEVER hit real URLs, databases, or APIs in unit tests
- Mock Prisma client for DB tests
- Mock fetch for HTTP tests
- Mock model router for agent tests

## Coverage Targets
- Tools: 90%+ (most critical code path)
- Services: 80%+ (focus on edge cases and errors)
- UI components: 60%+ (test behavior, not pixels)
- Run: `pnpm test` (all) or `pnpm test [name]` (specific)
- Coverage: `pnpm test:coverage`
