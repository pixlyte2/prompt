---
inclusion: always
---

# Infrastructure Patterns

## Container Stack (Podman)
5 local services: turtle-app (3000), turtle-postgres (5432), turtle-redis (6379), turtle-meilisearch (7700), turtle-minio (9000/9001). Ollama on shared dev server (11434).

- `env_file: .env` — single source of truth for all config
- Health checks on postgres (`pg_isready`) and redis (`redis-cli ping`)
- Named volumes for data persistence
- Bridge network: `turtle-net`
- App depends_on postgres + redis with condition: service_healthy

## Environment Variables
- 27 vars in `.env.example` with `[REQUIRED]` markers
- OLLAMA_URL points to shared dev server — DO NOT install Ollama locally
- AWS credentials are shared team credentials during dev — never commit to git
- NEXTAUTH_SECRET: generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Network Note
Corporate CrowdStrike blocks some external domains from node.exe. All LLM calls go through Ollama on internal network. Playwright uses chromium.exe (separate process, not blocked). Use Node 22 LTS.

## SSE Server
- Emit events for agent progress, scrape status, migration batches
- Clean up connections on disconnect (AbortController)
- Fire-and-forget — never await SSE emission in critical path

For full spec: `@specs/INFRASTRUCTURE.md`
