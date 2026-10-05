/**
 * Post-build guard: fails if built JS chunks exceed generous ceilings.
 * Run after `vite build` from the package root (`npm run build` in this workspace).
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "dist");

/** Max uncompressed size per matching basename pattern (bytes). Applies to ESM `.js` and CJS `.cjs`. */
const RULES = [
  { match: (name) => name.startsWith("ginger-") && (name.endsWith(".js") || name.endsWith(".cjs")), maxBytes: 95 * 1024 },
  { match: (name) => name === "testing/index.js" || name === "testing/index.cjs", maxBytes: 450 * 1024 },
  { match: (name) => name === "index.js" || name === "index.cjs", maxBytes: 8 * 1024 },
  { match: (name) => name === "client.js" || name === "client.cjs", maxBytes: 12 * 1024 },
  { match: (name) => name === "effects/index.js" || name === "effects/index.cjs", maxBytes: 80 * 1024 },
  {
    match: (name) =>
      (name.endsWith("/index.js") || name.endsWith("/index.cjs")) && !name.includes("testing"),
    maxBytes: 25 * 1024,
  },
  /** Shared Rollup chunks at dist root (hashed filenames). */
  {
    match: (name) =>
      !name.includes("/") &&
      (name.endsWith(".js") || name.endsWith(".cjs")) &&
      name !== "index.js" &&
      name !== "index.cjs" &&
      name !== "client.js" &&
      name !== "client.cjs",
    maxBytes: 45 * 1024,
  },
];

async function walkBundleFiles(dir, base = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const rel = join(base, e.name).replace(/\\/g, "/");
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkBundleFiles(full, rel)));
    } else if (
      (e.name.endsWith(".js") || e.name.endsWith(".cjs")) &&
      !e.name.endsWith(".map")
    ) {
      out.push({ rel, full });
    }
  }
  return out;
}

async function main() {
  const { statSync } = await import("node:fs");
  const files = await walkBundleFiles(root);
  const failures = [];
  let totalJs = 0;

  for (const { rel, full } of files) {
    const size = statSync(full).size;
    if (rel.endsWith(".js")) {
      totalJs += size;
    }
    const rule = RULES.find((r) => r.match(rel));
    if (rule && size > rule.maxBytes) {
      failures.push(`${rel}: ${size} bytes (max ${rule.maxBytes})`);
    }
  }

  const totalCap = 650 * 1024;
  if (totalJs > totalCap) {
    failures.push(`total ESM JS in dist: ${totalJs} bytes (max ${totalCap})`);
  }

  if (failures.length > 0) {
    console.error("Bundle size check failed:\n", failures.join("\n"));
    process.exit(1);
  }
  console.log(
    `Bundle size OK (${files.length} bundle files, ${totalJs} bytes ESM total, caps: per-pattern + ${totalCap} total).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
