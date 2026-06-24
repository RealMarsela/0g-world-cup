import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mkdirSync, writeFileSync } from "node:fs";
import { commitRoomResult } from "./src/server/chain/commitRoomResult";
import { runMatchCompute } from "./src/server/compute/runMatchCompute";
import { uploadRoomBundle } from "./src/server/storage/uploadRoomBundle";
import { completeDraft } from "./src/worldcup/game";
import { buildMatchResultFromCompute } from "./src/worldcup/matchCompute";
import type { DraftRoom, MatchResult } from "./src/worldcup/types";

async function readJsonBody(req: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function writeRuntimeArtifact(name: string, value: unknown) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  mkdirSync("proof-artifacts", { recursive: true });
  mkdirSync("public/proof-artifacts", { recursive: true });
  writeFileSync(`proof-artifacts/${name}`, body);
  writeFileSync(`public/proof-artifacts/${name}`, body);
}

// 0G World Cup — Vite React client
export default defineConfig({
  plugins: [
    {
      name: "0g-world-cup-local-api",
      configureServer(server) {
        server.middlewares.use("/api/match/compute", async (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }));
            return;
          }
          try {
            const body = (await readJsonBody(req)) as { room?: DraftRoom };
            if (!body.room) throw new Error("Missing room payload.");
            const room = completeDraft(body.room);
            const output = await runMatchCompute(room);
            if (output.authority === "blocked") {
              res.statusCode = 503;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "COMPUTE_BLOCKED", reason: output.blocker, output }));
              return;
            }
            const result = buildMatchResultFromCompute(room, output);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ output, result }));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              error: "COMPUTE_MATCH_FAILED",
              reason: error instanceof Error ? error.message : String(error),
            }));
          }
        });
        server.middlewares.use("/api/match/finalize", async (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }));
            return;
          }
          try {
            const body = (await readJsonBody(req)) as { room?: DraftRoom; result?: MatchResult };
            if (!body.room || !body.result) throw new Error("Missing room or result payload.");
            if (body.result.computeAuthority !== "compute") {
              const artifact = {
                schema: "0g-world-cup-runtime-finalize-proof-v1",
                status: "blocked",
                roomId: body.room.id,
                error: "FINALIZE_REQUIRES_COMPUTE_RESULT",
                reason: "Runtime finalization only accepts a real 0G Compute-authoritative result.",
                computeAuthority: body.result.computeAuthority,
                checks: {
                  rejectedDeterministicResult: true,
                  requiresComputeAuthority: true,
                  storageSkipped: true,
                  chainSkipped: true,
                },
              };
              writeRuntimeArtifact("runtime-finalize-latest.json", artifact);
              res.statusCode = 409;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(artifact));
              return;
            }
            const storage = await uploadRoomBundle(body.room, body.result);
            if (storage.status !== "live" || !storage.storageUri) {
              res.statusCode = 503;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "STORAGE_FINALIZE_BLOCKED", reason: storage.reason, storage }));
              return;
            }
            const resultForChain = {
              ...body.result,
              storageUri: storage.storageUri,
            };
            const chain = await commitRoomResult(body.room, resultForChain, storage.storageUri);
            const artifact = {
              status: chain.status === "submitted" || chain.status === "existing" ? "live" : "blocked",
              roomId: body.room.id,
              storage,
              chain,
            };
            writeRuntimeArtifact("runtime-finalize-latest.json", artifact);
            res.statusCode = artifact.status === "live" ? 200 : 503;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(artifact));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              error: "FINALIZE_MATCH_FAILED",
              reason: error instanceof Error ? error.message : String(error),
            }));
          }
        });
      },
    },
    react(),
    tailwindcss(),
  ],
  // Expose both VITE_ and NEXT_PUBLIC_ prefixes so Privy creds drop in either form.
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  base: process.env.VITE_BASE_PATH || "/",
  server: { host: "127.0.0.1", port: 5173 },
});
