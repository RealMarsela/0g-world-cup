import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

const key = process.env.OG_COMPUTE_API_KEY || process.env.VITE_OG_COMPUTE_API_KEY;
const endpoint =
  process.env.OG_COMPUTE_ENDPOINT ||
  process.env.VITE_OG_COMPUTE_ENDPOINT ||
  "https://router-api-testnet.integratenetwork.work/v1";

if (!key) {
  const artifact = {
    status: "blocked",
    reason: "Missing OG_COMPUTE_API_KEY or VITE_OG_COMPUTE_API_KEY.",
    env: publicEnvSummary(),
  };
  writeProofArtifact("compute-latest.json", artifact);
  console.log(JSON.stringify(artifact, null, 2));
  process.exit(0);
}

async function getModel() {
  if (process.env.OG_COMPUTE_MODEL) return process.env.OG_COMPUTE_MODEL;
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
  const model = await getModel();
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
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
    }),
  });

  if (!response.ok) {
    const artifact = {
      status: "blocked",
      reason: `0G Compute Router request failed: ${response.status} ${await response.text()}`,
      endpoint,
      model,
      env: publicEnvSummary(),
    };
    writeProofArtifact("compute-latest.json", artifact);
    console.log(JSON.stringify({ status: artifact.status, endpoint, model, reason: artifact.reason }, null, 2));
    process.exit(0);
  }

  const result = {
    status: "live",
    endpoint,
    model,
    response: await response.json(),
  };

  writeProofArtifact("compute-latest.json", result);
  console.log(JSON.stringify({ status: result.status, endpoint, model }, null, 2));
} catch (error) {
  const artifact = {
    status: "blocked",
    reason: error instanceof Error ? error.message : String(error),
    endpoint,
    env: publicEnvSummary(),
  };
  writeProofArtifact("compute-latest.json", artifact);
  console.log(JSON.stringify({ status: artifact.status, endpoint, reason: artifact.reason }, null, 2));
}
