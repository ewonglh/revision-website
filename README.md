<img src="assets/icon.svg" width="64" height="64" alt="">

# Revision

A focused space for exam revision. Starting with NUS ST2132 and CS2100: real questions, saved working, source-grounded feedback, and deliberate review.

**Status:** repository foundation. The starter has module selection and empty states; imports, authentication, marking and study scheduling are planned features.

## Develop

Node 24 and npm:

```sh
npm ci
npm run dev
npm run check
```

React, TypeScript and Vite; plain CSS and system fonts. Static build: `npm run build`, output `dist/`. This fits a Cloudflare Pages frontend; no live deployment or backend is provisioned. See [ADR 0001](docs/adr/0001-static-frontend-foundation.md).

## Build incrementally

- [Roadmap and stage issues](https://github.com/ewonglh/revision-website/issues/1)
- [Workflow](docs/workflow.md) and [contribution guide](CONTRIBUTING.md)
- [Agent instructions](AGENTS.md) and [skills configuration](docs/agents/issue-tracker.md)
- [Product specification](docs/feature-spec.md) and [domain context](CONTEXT.md)
- [Design direction](docs/design.md)
- [Reference-site audit](docs/reference-site-audit.md) and [source/licence search](docs/source-status.md)

Stages start in `needs-triage`. Refine them into bounded end-to-end child issues before marking them `ready-for-agent`. CI checks changes; it does not run unattended coding agents or deploy.

## Data and licensing

Keep private course files, student answers and credentials outside Git. Use original/synthetic or explicitly redistributable test content. No project software licence has been selected yet; public visibility alone does not grant a software licence or rights to course materials.
