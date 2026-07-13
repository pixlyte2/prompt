---
inclusion: always
---

# Error Handling Patterns

## Principle
Fail gracefully, log everything, retry intelligently, surface clearly. Agents don't crash — they adapt. Users don't see stack traces — they see actionable messages.

## Standard Error Classes (packages/core/utils/errors.ts)
- `TurtleError` — base class with message, code, retryable flag
- `HttpError` — extends TurtleError with status, url
- `TimeoutError` — extends TurtleError with url, durationMs
- `AgentError` — extends TurtleError with agentId
- `ModelRouterError` — extends TurtleError with tier
- `ConnectorError` — extends TurtleError with connectorId

## HTTP Retry
- Default: 3 retries, exponential backoff (1s → 2s → 4s), max 30s
- Retryable: 408, 429, 500, 502, 503, 504
- Non-retryable: 400, 401, 403, 404
- 429: respect Retry-After header
- 15s timeout on all external HTTP calls (AbortController)

## Agent Errors
- Tool exception → catch, return ToolResult with success:false, agent reasons about next step
- 3 consecutive failures → fall back to deterministic pipeline
- 5 consecutive failures → pause, ask human
- Token budget exceeded → pause, ask human to approve more

## LLM Errors
- Ollama down → escalate to Tier 2 (Bedrock)
- Bedrock throttled → wait for Retry-After
- Malformed LLM response → retry same tier once, then escalate
- All tiers fail → ask human via conversational UI. Never crash.

## Logging
Structured context on every error: agentId, projectId, nodeId, error message, code, retryable, attempt number, duration.

For full spec: `@specs/ERROR-HANDLING.md`
