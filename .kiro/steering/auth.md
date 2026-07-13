---
inclusion: always
---

# Auth Patterns

## NextAuth.js Setup
- Session: JWT in HTTP-only secure cookie, 24h expiry
- Providers: Credentials (Sprint 0), Microsoft OAuth + Google OAuth (Sprint 1), SAML (Phase 2)
- First-user bootstrap: one-time admin creation when user table is empty

## RBAC (Three Roles, Project-Scoped)
- **Viewer:** Read-only. Can browse content tree, view analysis, see reports. Cannot trigger actions or interact with AI.
- **Editor:** Full content operations. Trigger scrapes, interact with AI, refine content, configure migrations, approve agent decisions.
- **Admin:** Everything + user management, project creation, system settings, API keys, guardrail config.

## Key Rules
- Every tRPC procedure MUST call `requireRole()` — no exceptions
- `requireRole` checks `acceptedAt IS NOT NULL` — pending invites don't grant access
- Role hierarchy: admin > editor > viewer (numeric comparison, not string)
- First-user setup endpoint returns 403 FOREVER after first admin exists
- All user management operations are transactional
- Password hashing: bcrypt. Invite tokens: stored as bcrypt hash, expire 72h.

## Invite Flow
Admin sends invite → system generates token + sends email → user clicks link → new user creates account / existing user gets project added → JWT session issued

For full spec: `@specs/AUTH.md`
