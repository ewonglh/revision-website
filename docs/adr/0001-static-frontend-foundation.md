# ADR 0001: Start with a static React and TypeScript frontend

Status: accepted for the scaffold. Date: 12 November 2026.

## Context

The user has no framework preference and wants a minimal, attractive, performant website hosted on Cloudflare Pages. The product requires mathematical work, code, document evidence and eventually private asynchronous marking, but the current task is a repository/workflow foundation rather than feature implementation.

## Decision

Use React, strict TypeScript, Vite and plain CSS with semantic design tokens. Use Node 24, npm and a committed lockfile. Produce static assets in `dist/` for Cloudflare Pages. Keep the initial UI to real module-selection controls and honest empty states.

Use ESLint, Prettier, TypeScript, Vitest and a production build in CI. The empty scaffold has no meaningful behaviour suite; the first functional slices add tests for their contracts. Keep expensive editors, math rendering and document viewers out of the initial bundle until required.

## Alternatives

- SvelteKit or Vue: both suitable, but there is no project-specific requirement that outweighs React's library ecosystem and broad coding-agent familiarity for this starter.
- Next.js or another server-rendered framework: could work, but server rendering is not currently required for a private study application and would add deployment/runtime choices before backend evaluation.
- A monorepo or preselected full-stack platform: premature before source/marking evaluation and unnecessary for the present single application.

## Consequences

Pages hosting is straightforward, the app remains portable, and route-level tools can be loaded when needed. React has a real runtime cost; track bundle growth and avoid adding a component framework by default. Backend services, authentication, storage, retrieval, model providers, durable jobs and exam consistency remain unresolved and must be decided in a subsequent architecture ADR with representative samples and costs.

No automatic deployment or worker system is installed. A public repository licence has not yet been chosen; public visibility alone is not a licence declaration, and course-material permissions remain separate.
