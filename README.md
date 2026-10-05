# `ginger` monorepo

## Links

- **Library package** (`@lucaismyname/ginger`): [packages/ginger/README.md](./packages/ginger/README.md)
- **Changelog** (published with the package): [packages/ginger/CHANGELOG.md](./packages/ginger/CHANGELOG.md)
- **Narrative + API docs map**: [packages/ginger/docs/README.md](./packages/ginger/docs/README.md)

## Common Commands

- Verify everything locally (same order as CI): `npm run verify`
- **First-time / fresh clone:** build the library before running apps (`apps/*` resolve `@lucaismyname/ginger` from `packages/ginger/dist`, which is not committed):

  ```bash
  npm ci
  npm run build -w @lucaismyname/ginger
  ```

- Demo app: `npm run dev`
- Landing app: `npm run dev:landing`
- E2E tests (demo): `npm run e2e -w ginger-demo`
- Publish the library: `npm run publish:lib` (see **Publishing** below)

## Apps

- **`apps/ginger-landing`**: Marketing page with a live Ginger player, **same-origin MP3 samples** under `public/samples/`, Quick Start snippet with **lazy-loaded** syntax highlighting (Prism in a separate chunk), and install/links. Social meta is injected at build time (`VITE_SITE_URL`, optional `VITE_OG_IMAGE_URL`; see `apps/ginger-landing/.env.example`). Default **`public/og.jpg`** is referenced via raw GitHub when the canonical URL is still the repo. UI is split across `src/components/`, `src/hooks/`, and `src/data/`.
- **`apps/demo`**: Feature matrix for the library (queue, waveform, EQ, spatial, transcript, …). Examples use **orange** as the primary accent. **Playwright** smoke tests live under `e2e/`.

## Quality

- **Linting & formatting**: [Biome](https://biomejs.dev) (library + apps share formatter/import organization where enabled)
- **Pre-commit hooks**: [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) run Biome on staged `*.ts` / `*.tsx` in `packages/ginger` and `apps/**`
- **Unit tests**: Vitest (`packages/ginger`)
- **E2E tests**: Playwright (`ginger-demo`)
- **CI**: GitHub Actions on PRs and pushes to `main` (Node 20 + 22)

## Publishing `@lucaismyname/ginger`

From the **repository root**, run:

```bash
npm run publish:lib
```

This runs `npm publish` **inside** [`packages/ginger`](./packages/ginger) so the npm registry shows **that folder’s** [`README.md`](./packages/ginger/README.md) on the package page. Using `npm publish -w @lucaismyname/ginger` from the root can associate the **monorepo root** `README.md` with the package metadata instead.
