import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const root = resolve(new URL("../../", import.meta.url).pathname);

export function pathFor(path) {
  return resolve(root, path);
}

export async function readJson(path) {
  return JSON.parse(await readFile(pathFor(path), "utf8"));
}

export async function writeJson(path, value) {
  const abs = pathFor(path);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, `${JSON.stringify(value, null, 2)}\n`);
}

export function sha256(value) {
  return `0x${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

export function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function playerId(countryCode, index) {
  return `${countryCode.toLowerCase()}-${String(index + 1).padStart(3, "0")}`;
}
