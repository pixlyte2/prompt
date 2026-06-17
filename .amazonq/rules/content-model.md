# Content Model Patterns

## ContentNode (Primary Entity)
5 JSONB columns for schema-flexible storage:
- `raw_content` â€” original scraped HTML/data
- `structured` â€” AI-parsed semantic content (headings, body, CTAs, images, components)
- `metadata` â€” SEO, OpenGraph, schema.org
- `analysis` â€” quality scores, classification, suggestions
- `refinements` â€” array of AI edits with approval status

Status flow: scraped â†’ analyzed â†’ refined â†’ approved â†’ migrated

## Prisma Rules
- Prisma is source of truth for schema â€” not DATABASE-SCHEMA.sql
- Every model has project_id foreign key
- Prisma middleware auto-injects project_id filter on every query
- Use `select` to fetch only needed fields
- `createMany()` for bulk inserts â€” never loop with individual creates
- Transactions for multi-step operations

## Meilisearch Integration
- Index: `content_nodes` â€” searchable: title, slug, structured.body, metadata.description
- Filterable: project_id, node_type, status, source_cms
- Indexing is async and non-blocking â€” failures never stop the pipeline
- Failures logged and retried via queue â€” search index can always be rebuilt from PostgreSQL

## Headless API
- Read-only REST at `/api/v1/content/:projectId/`
- Only serves content with status='approved' or 'published' (publish gate)
- Project-scoped API keys for external consumers

For full spec: `@specs/CONTENT-MODEL.md`
