---
inclusion: always
---

# Agent Framework Patterns

## Core Interfaces
- `Agent`: id, goal, tools[], maxIterations, maxTokenBudget
- `Tool`: name, description, parameters (JSONSchema), execute(params) → ToolResult
- `AgentState`: observations[], actions[], plan[], tokensUsed, status
- `AgentDecision`: type ('use_tool' | 'ask_human' | 'complete'), tool?, params?, reasoning

## The Loop
```
while (!isComplete && iterations < max) {
  observe → reason (via model router) → act (tool or ask_human) → updateState → logTrace → emitSSE
}
```

## Guardrails
- Max iterations: pause and escalate to human
- Token budget: downgrade to cheaper model or pause for approval
- 3 consecutive failures → fall back to deterministic pipeline
- 5 consecutive failures → pause, ask human for guidance
- Tool execution timeout: 60s max per tool call (Promise.race)

## Key Rules
- Tool execute() MUST be wrapped in safeExecuteTool with timeout
- LLM responses WILL sometimes be malformed JSON — parse with try/catch, retry once
- Don't await SSE emission — fire and forget
- AgentTrace logs EVERY iteration: observation, decision, result, model tier, tokens, duration
- All agents share this exact loop — differentiation is in tools and system prompts

For full spec: `@specs/AGENT-FRAMEWORK.md`
