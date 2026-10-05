/**
 * Fails when committed Typedoc output under docs/api is out of date.
 * Run after `npm run docs:api` from the package root.
 */
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const pkgRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");

try {
  execSync("git diff --quiet -- docs/api", { cwd: pkgRoot, stdio: "pipe" });
  execSync("git diff --cached --quiet -- docs/api", { cwd: pkgRoot, stdio: "pipe" });
  console.log("docs/api is up to date with generated Typedoc output.");
} catch {
  console.error(
    "docs/api is out of date. Run `npm run docs:api -w @lucaismyname/ginger` and commit the changes.",
  );
  process.exit(1);
}
