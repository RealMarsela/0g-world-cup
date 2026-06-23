type RuntimeEnv = Record<string, string | undefined>;

const nodeEnv = (globalThis as unknown as { process?: { env?: RuntimeEnv } }).process?.env;
const viteEnv = import.meta.env as RuntimeEnv | undefined;

export function envValue(name: string) {
  return viteEnv?.[name] ?? nodeEnv?.[name] ?? "";
}

export function hasEnv(name: string) {
  return Boolean(envValue(name));
}
