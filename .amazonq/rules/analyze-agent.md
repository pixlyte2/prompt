# Analyze Agent Patterns

## Tools
- `content_classify` â€” classify every node by type (page, article, product, etc.). Drives all subsequent analysis.
- `quality_score` â€” score seo/readability/accessibility/overall (0-100). HEURISTIC ONLY â€” no AI calls.
- `structure_extract` â€” transform raw HTML into semantic JSON (headings, body, CTAs, images). Run on ALL nodes.
- `duplicate_detect` â€” hash title + first 200 chars, flag matches. Don't remove â€” human decides.
- `seo_audit` â€” deep SEO analysis. ONLY on landing pages and high-value content (expensive).
- `content_refine` â€” AI-powered rewrites. ONLY when user requests via chat. Always pending approval.
- `relationship_map` â€” map cross-references and internal links after structure extraction.

## Key Rules
- Classification is HEURISTIC (URL patterns, instant, free) â€” not AI
- Quality scoring is HEURISTIC (count meta tags, headings, alt text) â€” never Claude
- Structure extraction uses Cheerio heuristics (free) for simple pages, Claude only for complex
- Component detection is the ONLY step that needs Claude (semantic layout understanding)
- For sites >200 pages: classify sample first, detect templates, batch-process by template
- Scores: 90-100 excellent, 70-89 good, 50-69 needs attention, <50 flag for human review
- Refinements: ALWAYS produce before/after diff, NEVER auto-apply â€” set approval_status='pending'

For full spec: `@specs/ANALYZE-AGENT.md`
