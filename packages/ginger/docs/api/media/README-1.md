# Ginger documentation (`packages/ginger/docs`)

This folder holds **narrative docs** (Markdown) and a **generated API site** (HTML). Use this README as a map; everything below is written for humans, not for npm publish (the published tarball still includes only `dist`, `README.md`, `CHANGELOG.md`, `LICENSE`—see the package root [`README.md`](../README.md) for install and overview).

**Monorepo context:** The [repository root `README.md`](https://github.com/lucaismyname/ginger/blob/main/README.md) describes `apps/demo`, `apps/ginger-landing`, CI, Husky, Playwright, and how to run `npm run publish:lib` so npm shows the **package** readme.

## What lives where

| Path | Purpose |
|------|---------|
| **[`../CHANGELOG.md`](../CHANGELOG.md)** | Version history for `@lucaismyname/ginger` (also included in the npm package) |
| **[`getting-started.md`](./getting-started.md)** | Install, minimal `<Ginger.Provider>` example, core concepts, links onward |
| **[`api-overview.md`](./api-overview.md)** | Table of public import paths (`@lucaismyname/ginger`, subpaths), relation to TypeDoc |
| **[`reference/subpaths.md`](./reference/subpaths.md)** | Deep dive on optional `@lucaismyname/ginger/*` entrypoints (client, testing, waveform, EQ, …) |
| **[`reference/components.md`](./reference/components.md)** | Checklist-style list of `Ginger.*` compound components (including declarative `Ginger.Tracks` / `Ginger.Track`) |
| **[`reference/hooks.md`](./reference/hooks.md)** | Checklist-style list of hooks; points to subpaths for advanced hooks |
| **[`guides/`](./guides/)** | How-to guides: recipes, testing, accessibility, streaming adapters |
| **[`GAPLESS_ROADMAP.md`](./GAPLESS_ROADMAP.md)** | Experimental gapless work (milestones; not a user tutorial) |
| **[`api/`](./api/)** | **Generated** TypeDoc output (`npm run docs:api` from `packages/ginger`). Open [`api/index.html`](./api/index.html) in a browser after building. |
| **[`api/media/`](./api/media/)** | Markdown assets copied or referenced by TypeDoc during HTML generation. Treat these as support files for the generated site, not as the primary narrative docs to edit by hand. |

## Generated vs hand-written

- **Hand-written** Markdown is the source of truth for *how things fit together* (architecture, mental model, SSR, testing patterns).
- **Generated** HTML under `docs/api/` is produced by [TypeDoc](https://typedoc.org/) from `src/**/*.ts` entry points listed in [`typedoc.json`](../typedoc.json). It is ideal for **per-symbol** types, parameters, and return values.
- **Canonical subpath guide:** use [`reference/subpaths.md`](./reference/subpaths.md) as the hand-written source of truth for `@lucaismyname/ginger/*` entrypoints. Any similarly named file under `docs/api/media/` exists to support TypeDoc output and should stay minimal to avoid drift.
- If something disagrees, **trust the TypeScript source and generated API** for exact signatures; use Markdown for explanation and examples.

## Regenerate the API site

From `packages/ginger`:

```bash
npm run docs:api
```

Requires a successful `npm run build` first if you want links to resolve against built `.d.ts` the same way CI does; TypeDoc uses [`typedoc.json`](../typedoc.json), `tsconfig.json`, and the listed entry files directly.

## Suggested reading order

1. Root [`README.md`](../README.md) (package pitch + quick example).
2. [`CHANGELOG.md`](../CHANGELOG.md) for release notes.
3. [`getting-started.md`](./getting-started.md).
4. [`reference/components.md`](./reference/components.md) + [`reference/hooks.md`](./reference/hooks.md) while coding.
5. [`guides/recipes.md`](./guides/recipes.md) for queue updates, autoplay, persistence.
6. [`reference/subpaths.md`](./reference/subpaths.md) when you need waveform, EQ, effects, spatial, transcript, remote, crossfade, devtools, or gapless probe.
7. [`guides/testing.md`](./guides/testing.md) if you add automated tests around Ginger.
