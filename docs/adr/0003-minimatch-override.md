# ADR 0003: Pin minimatch to 11.0.8 to clear a dev-only advisory

Status: proposed. Date: 14 November 2026. Supersedes nothing; revisit when a 10.x fix ships.

## Context

`npm audit` reported GHSA-g3hv-75wg-m249 (moderate: denial of service via globparts
amplification), which affected `minimatch` `>=7.0.0 <11.0.1`. The advisory surfaced
across ten dependency nodes, but all of them traced to a single `minimatch` in the
development lint toolchain:

| Dependent                                     | Declared range      |
| --------------------------------------------- | ------------------- |
| `@eslint/config-array@0.23.5`                 | `minimatch ^10.2.4` |
| `@typescript-eslint/typescript-estree@8.72.2` | `minimatch ^10.2.2` |

The patched versions are **11.0.1 and later**, which fall outside both declared
ranges. There is no 10.x release containing the fix (the latest 10.x is 10.2.6).
No compatible upstream fix exists at the time of writing.

`npm audit fix --force` proposed downgrading ESLint to 9.39.5 and
`typescript-eslint` to 8.36.0. That trades a moderate, development-only advisory
for a major regression of the toolchain that runs every check.

## Decision

Add a single root override in `package.json`:

```json
"overrides": {
  "minimatch": "11.0.8"
}
```

This pins the transitive dependency without changing the declared dependency of
either parent. The change is two files: `package.json` and the affected lockfile
subtree.

## Evidence

Measured on `main` at `2b715ae`, and re-verified on a pristine `git archive` copy
with a fresh `npm ci`:

| Check                                          | Result                                     |
| ---------------------------------------------- | ------------------------------------------ |
| `npm audit` after fresh install                | 0 vulnerabilities                          |
| `npm audit --omit=dev`                         | 0 vulnerabilities                          |
| `npm ls minimatch --all`                       | one node, 11.0.8, `dev: true`              |
| `npm run check` from clean install             | format, lint, typecheck, 70 tests, build   |
| ESLint file selection, 10.2.6 vs 11.0.8        | identical (14 files under the repo config) |
| ESLint messages and error counts               | identical, 0 both                          |
| Direct minimatch comparison, 43 glob cases     | 0 differing results                        |
| Lockfile changes outside the minimatch subtree | none; no production package touched        |

The glob comparison exercised brace expansion, globstar, extglob negation, `dot`,
`matchBase`, `nocase`, multi-root braces and ignore lists, because "lint exited 0"
would not reveal changed matching semantics.

An override that stops matching the lockfile fails loudly: `npm ci` exits with
`EUSAGE` rather than installing a different version, so this cannot silently stop
applying.

## Alternatives

- **`npm audit fix --force`**: rejected. It downgrades ESLint and
  `typescript-eslint` by a major version, which the stage's non-goals forbid and
  which would change the behaviour of every lint run to silence a warning.
- **Switching linters**: rejected as disproportionate to a moderate advisory in a
  development-only dependency, and it would invalidate the existing config.
- **Accepting the advisory**: rejected because the fix is cheap, reversible and
  verified, and leaving a known advisory open trains people to ignore audit output.
- **Scoping the override to each parent package**: tighter in principle, but it
  duplicates the version in two places and npm's dedupe makes the global form
  behave identically here. The global form is simpler to remove in one edit.

## Implications

- The pinned version is **outside both parents' declared ranges**. This is a
  deliberate exception, not an upstream fix, and it must not be presented as one.
- The repository now depends on minimatch 11 semantics. Behaviour was compared
  against 10.2.6 across the repo's config surface and 43 glob cases; minimatch's
  internals were not audited.
- minimatch 11 raises its Node engine floor to `20 || >=22`. The repository
  requires `>=24 <25`, so nothing changes in practice.
- The advisory is **development-only** and unreachable from the built bundle. This
  clears the audit; it does not fix a production vulnerability, and it should not
  be described as one.
- **Remove the override** when a 10.x release contains the patch, or when both
  parents raise their ranges to accept 11. Removing it should restore the
  undeclared-range-free state; running `npm audit` afterwards confirms whether it
  is still needed.
