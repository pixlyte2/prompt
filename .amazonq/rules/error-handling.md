# Error Handling Patterns

## Principle
Fail gracefully, log everything, retry intelligently, surface clearly. Agents don't crash â€” they adapt. Users don't see stack traces â€” they see actionable messages.

## Standard Error Classes (packages/core/utils/errors.ts)
- `TurtleError` â€” base class with message, code, retryable flag
- `HttpError` â€” extends TurtleError with status, url
- `TimeoutError` â€” extends TurtleError with url, durationMs
- `AgentError` â€” extends TurtleError with agentId
- `ModelRouterError` â€” extends TurtleError with tier
- `ConnectorError` â€” extends TurtleError with connectorId

## HTTP Retry
- Default: 3 retries, exponential backoff (1s â†’ 2s â†’ 4s), max 30s
- Retryable: 408, 429, 500, 502, 503, 504
- Non-retryable: 400, 401, 403, 404
- 429: respect Retry-After header
- 15s timeout on all external HTTP calls (AbortController)

## Agent Errors
- Tool exception â†’ catch, return ToolResult with success:false, agent reasons about next step
- 3 consecutive failures â†’ fall back to deterministic pipeline
- 5 consecutive failures â†’ pause, ask human
- Token budget exceeded â†’ pause, ask human to approve more

## LLM Errors
- Ollama down â†’ escalate to Tier 2 (Bedrock)
- Bedrock throttled â†’ wait for Retry-After
- Malformed LLM response â†’ retry same tier once, then escalate
- All tiers fail â†’ ask human via conversational UI. Never crash.

## Logging
Structured context on every error: agentId, projectId, nodeId, error message, code, retryable, attempt number, duration.

For full spec: `@specs/ERROR-HANDLING.md`
