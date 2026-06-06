# fiberWatch

Turborepo monorepo (pnpm workspaces). Apps live in `apps/*`, shared config/libs in `packages/*`.

- `apps/dashboard` — Next.js app.
- `apps/api` — Effect HTTP server, runs on the **Bun** runtime (`bun src/main.ts`).

## Effect

This repo uses **Effect v4 (beta)**. Versions are cataloged in `pnpm-workspace.yaml`
under `catalog:` — reference them from package.json as `"effect": "catalog:"` so all
packages stay on one pinned version. Do not bump Effect versions in individual
package.json files; change the catalog.

Key v4 differences from v3:
- HTTP modules live in **`effect/unstable/http`** (e.g. `HttpRouter`, `HttpServer`,
  `HttpServerResponse`, `HttpMiddleware`), not in `@effect/platform`.
- Routes are **Layers**: `HttpRouter.add(method, path, handler)` returns a Layer;
  compose with `Layer.mergeAll`, serve with `HttpRouter.serve`, back it with
  `BunHttpServer.layer` from `@effect/platform-bun`, launch via `BunRuntime.runMain`.

<!-- effect-solutions:start -->
## Effect Best Practices

**IMPORTANT:** Always consult effect-solutions before writing Effect code.

1. Run `effect-solutions list` to see available guides
2. Run `effect-solutions show <topic>...` for relevant patterns (supports multiple topics)
3. Search `~/.local/share/effect-solutions/effect` for real implementations

Topics: quick-start, project-setup, tsconfig, basics, services-and-layers, data-modeling, error-handling, config, testing, cli.

Never guess at Effect patterns - check the guide first.
<!-- effect-solutions:end -->

## Local Effect Source

The Effect source is cloned to `~/.local/share/effect-solutions/effect` for reference.
Use it to explore APIs, find usage examples, and read type definitions when the docs
aren't enough. Note: when checking v4 APIs, prefer reading the installed package types
in `node_modules` — the cloned source tracks the v3 line and may differ from the v4 beta.
