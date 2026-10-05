/** Dev-only logging without a Node `process` global. Bundlers may still define it at runtime. */
export function isDevEnvironment(): boolean {
  const nodeEnv =
    typeof globalThis !== "undefined" && "process" in globalThis
      ? (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV
      : undefined;
  return nodeEnv != null && nodeEnv !== "production";
}
