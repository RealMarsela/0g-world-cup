import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";
import { getComputeEnvCandidates } from "../../src/server/env";

loadLocalEnv();

const candidates = getComputeEnvCandidates();

if (!candidates.length) {
  const artifact = {
    status: "blocked",
    reason: "Missing OG_COMPUTE_API_KEY, VITE_OG_COMPUTE_API_KEY, or ZEROG_ROUTER_API_KEY.",
    env: publicEnvSummary(),
  };
  writeProofArtifact("compute-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

async function getModel(endpoint: string, key: string, configuredModel: string) {
  if (configuredModel) {
    return configuredModel;
  }
  const response = await fetch(`${endpoint}/models`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error(`Model list failed: ${response.status} ${await response.text()}`);
  const json = await response.json() as { data?: { id?: string }[] };
  const model = json.data?.find((item) => item.id)?.id;
  if (!model) throw new Error("0G Compute Router returned no model IDs.");
  return model;
}

try {
  const failures: { source: string; endpoint: string; model?: string; reason: string }[] = [];
  for (const candidate of candidates) {
    const model = await getModel(candidate.endpoint, candidate.apiKey, candidate.model);
    const response = await fetch(`${candidate.endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${candidate.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Return concise JSON for a normal football match simulation proof." },
          {
            role: "user",
            content:
              "Create one tactical highlight for 0G World Cup, the blockchain football draft game. Include minute, team, player, type, and narration.",
          },
        ],
        temperature: 0.2,
        max_tokens: 180,
        verify_tee: true,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });

    if (!response.ok) {
      failures.push({
        source: candidate.source,
        endpoint: candidate.endpoint,
        model,
        reason: `0G Compute Router request failed: ${response.status} ${await response.text()}`,
      });
      continue;
    }

    const result = {
      status: "live",
      source: candidate.source,
      endpoint: candidate.endpoint,
      model,
      response: await response.json(),
      failedCandidates: failures,
    };

    writeProofArtifact("compute-latest.json", result);
    console.log(JSON.stringify({ status: result.status, source: result.source, endpoint: result.endpoint, model }, null, 2));
    process.exit(0);
  }

  const artifact = {
    status: "blocked",
    reason: failures.map((failure) => `${failure.source} ${failure.model ?? ""}: ${failure.reason}`).join(" | "),
    candidates: failures,
    env: publicEnvSummary(),
  };
  writeProofArtifact("compute-latest.json", artifact);
  console.log(JSON.stringify({ status: artifact.status, reason: artifact.reason }, null, 2));
} catch (error) {
  const artifact = {
    status: "blocked",
    reason: error instanceof Error ? error.message : String(error),
    env: publicEnvSummary(),
  };
  writeProofArtifact("compute-latest.json", artifact);
  console.log(JSON.stringify({ status: artifact.status, reason: artifact.reason }, null, 2));
}
