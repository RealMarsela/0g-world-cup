import type { Artifact } from "./zeroGArtifacts";

export function ZeroGArtifactDetails({ artifact }: { artifact: Artifact }) {
  return (
    <div className="mt-2 grid gap-1 text-xs text-muted">
      {artifact.txHash && <p className="break-all font-mono">tx {artifact.txHash}</p>}
      {artifact.transactions && Object.entries(artifact.transactions).map(([key, value]) => (
        <p className="break-all font-mono" key={key}>{key} tx {value}</p>
      ))}
      {artifact.mintTxHash && <p className="break-all font-mono">mint {artifact.mintTxHash}</p>}
      {artifact.rootHash && <p className="break-all font-mono">root {artifact.rootHash}</p>}
      {artifact.snapshotHash && <p className="break-all font-mono">snapshot {artifact.snapshotHash}</p>}
      {artifact.playerCount && <p className="font-mono">{artifact.playerCount} players / {artifact.teamCount ?? "?"} squads</p>}
      {artifact.blobHash && <p className="break-all font-mono">blob {artifact.blobHash}</p>}
      {artifact.bundleHash && <p className="break-all font-mono">bundle {artifact.bundleHash}</p>}
      {artifact.contentHash && <p className="break-all font-mono">content {artifact.contentHash}</p>}
      {artifact.encryptedMetadataHash && <p className="break-all font-mono">metadata {artifact.encryptedMetadataHash}</p>}
      {artifact.contract && <p className="break-all font-mono">contract {artifact.contract}</p>}
      {typeof artifact.canStart === "boolean" && <p className="font-mono">canStart {String(artifact.canStart)}</p>}
      {artifact.escrow && <p className="break-all font-mono">escrow deposits {String(artifact.escrow.depositCount ?? "?")} / wagerWei {String(artifact.escrow.wagerAmountWei ?? "?")} / settled {String(artifact.escrow.settled ?? "?")}</p>}
      {artifact.tokenId && <p className="font-mono">token {artifact.tokenId}</p>}
      {artifact.blockNumber && <p className="font-mono">block {artifact.blockNumber}</p>}
      {artifact.blockNumbers && <p className="font-mono">blocks {Object.values(artifact.blockNumbers).join(" / ")}</p>}
      {artifact.byteCount && <p className="font-mono">{artifact.byteCount} bytes read back</p>}
      {artifact.storageUri && <p className="break-all font-mono">{artifact.storageUri}</p>}
      {artifact.downloadedRoots && <p className="break-all font-mono">read {artifact.downloadedRoots.join(" / ")}</p>}
      {artifact.downloadedMerkleRoot && <p className="break-all font-mono">read {artifact.downloadedMerkleRoot}</p>}
      {artifact.items && <p>{artifact.items.join(" / ")}</p>}
      {artifact.checks && <p>{Object.entries(artifact.checks).map(([key, ok]) => `${key}:${ok ? "ok" : "fail"}`).join(" / ")}</p>}
      {artifact.count && <p className="font-mono">{artifact.count} agents</p>}
      {artifact.coverageHash && <p className="break-all font-mono">coverage {artifact.coverageHash}</p>}
      {artifact.readbackHash && <p className="break-all font-mono">readback {artifact.readbackHash}</p>}
      {artifact.pipelineHash && <p className="break-all font-mono">pipeline {artifact.pipelineHash}</p>}
      {artifact.selectedSource && <p className="font-mono">selected source {artifact.selectedSource}</p>}
      {artifact.workPlayerCount && <p className="font-mono">pipeline players {artifact.workPlayerCount}</p>}
      {artifact.workSnapshotHash && <p className="break-all font-mono">work snapshot {artifact.workSnapshotHash}</p>}
      {artifact.publishedSnapshotHash && <p className="break-all font-mono">published snapshot {artifact.publishedSnapshotHash}</p>}
      {artifact.historicalSnapshot && <p className="break-all font-mono">historical {String(artifact.historicalSnapshot.playerCount ?? "?")} players / {String(artifact.historicalSnapshot.teamCount ?? "?")} squads / root {String(artifact.historicalSnapshot.rootHash ?? "?")}</p>}
      {artifact.cloudflareManifest && <p className="break-all font-mono">cloudflare manifest d1 {String((artifact.cloudflareManifest.d1Seed as Record<string, unknown> | undefined)?.path ?? "?")} / r2 {String(artifact.cloudflareManifest.r2ObjectKey ?? "?")} / kv {String((artifact.cloudflareManifest.kv as Record<string, unknown> | undefined)?.key ?? "?")}</p>}
      {artifact.counts && <p className="font-mono">coverage counts {Object.entries(artifact.counts).map(([key, value]) => `${key}:${value}`).join(" / ")}</p>}
      {artifact.coverage?.map((item) => <p className="break-all font-mono" key={String(item.id)}>{String(item.id)} / {String(item.layer)} / {String(item.status)} / {String(item.proof)}</p>)}
      {artifact.agents && artifact.agents.map((agent) => (
        <p className="break-all font-mono" key={String(agent.agentId)}>
          {String(agent.agentId)} token {String(agent.tokenId ?? agent.agenticTokenId ?? "?")}
          {" / "}owner {String(agent.onChainOwner ?? agent.owner ?? "?")}
          {" / "}root {String(agent.storageRoot ?? agent.rootHash ?? "?")}
          {" / "}content {String(agent.contentHash ?? "?")}
          {" / "}tokenReadback {String(agent.fullTokenReadback ?? agent.exists ?? "?")}
          {" / "}metadataReadback {String(agent.metadataReadback ?? (agent.checks as Record<string, unknown> | undefined)?.decryptedAgentMatches ?? "?")}
        </p>
      ))}
      {artifact.storage && <p className="break-all font-mono">runtime storage {String(artifact.storage.storageUri ?? artifact.storage.reason ?? "pending")}</p>}
      {artifact.chain && <p className="break-all font-mono">runtime chain {String(artifact.chain.status ?? "pending")} {String(artifact.chain.txHash ?? "")}</p>}
      {artifact.compute && <p className="break-all font-mono">compute {String(artifact.compute.endpoint ?? "")} / live {String(artifact.compute.live)} / {String(artifact.compute.reason ?? "")}</p>}
      {artifact.compute?.probes?.map((probe, index) => (
        <p className="break-all font-mono" key={`${String(probe.source ?? "?")}:${String(probe.endpoint ?? "?")}:${String(probe.model)}:${String(probe.statusCode)}:${index}`}>
          {String(probe.model)} status {String(probe.statusCode)} {String(probe.errorCode ?? probe.message ?? "")}
        </p>
      ))}
      {artifact.wallet && <p className="break-all font-mono">broker wallet {String(artifact.wallet.address ?? "missing")} / balance {String(artifact.wallet.nativeBalanceOg ?? "?")} 0G / min {String(artifact.wallet.minimumLedgerOg ?? "?")} 0G / top up {String(artifact.wallet.requiredTopUpOg ?? "?")} 0G / can fund {String(artifact.wallet.canFundMinimumLedger)}</p>}
      {artifact.broker && <p className="break-all font-mono">broker services {String(artifact.broker.serviceCount ?? 0)} / provider {String(artifact.broker.preferredService?.provider ?? "missing")} / model {String(artifact.broker.metadata?.model ?? artifact.broker.preferredService?.model ?? "unknown")}</p>}
      {artifact.broker?.metadata?.endpoint && <p className="break-all font-mono">broker endpoint {artifact.broker.metadata.endpoint}</p>}
      {artifact.broker?.metadata?.error && <p>{artifact.broker.metadata.error}</p>}
      {artifact.broker?.error && <p>{artifact.broker.error}</p>}
      {artifact.ledger && <p className="break-all font-mono">ledger readable {String(artifact.ledger.readable)} / exists {String(artifact.ledger.exists)} / {String(artifact.ledger.error ?? "")}</p>}
      {artifact.output && <p className="break-all font-mono">runtime compute {String(artifact.output.authority)} / {String(artifact.output.computeMode)} / path {String(artifact.output.receipt?.path ?? "blocked")}</p>}
      {artifact.output?.receipt?.provider && <p className="break-all font-mono">runtime provider {artifact.output.receipt.provider}</p>}
      {artifact.output?.blocker && <p>{artifact.output.blocker}</p>}
      {artifact.da && <p className="break-all font-mono">da client {String(artifact.da.daClientGrpc || "missing")} / 51001 {String(artifact.da.daClientListening)} / encoder {String(artifact.da.encoderListening)} / retriever {String(artifact.da.retrieverListening)} / entrance code {String(artifact.da.daEntranceHasCode)}</p>}
      {artifact.da?.daEntrance && <p className="break-all font-mono">DAEntrance {String(artifact.da.daEntrance.address ?? "missing")} / bytes {String(artifact.da.daEntrance.codeBytes ?? "?")} / {String(artifact.da.daEntrance.reason ?? "")}</p>}
      {artifact.da?.daEntranceCandidates && <p className="break-all font-mono">DAEntrance candidates {artifact.da.daEntranceCandidates.map((candidate) => `${String(candidate.address ?? "?")}:${String(candidate.codeBytes ?? "?")}b`).join(" / ")}</p>}
      {artifact.da?.stackStatus && <p className="font-mono">da stack {artifact.da.stackStatus}</p>}
      {artifact.da?.officialMaxBlobBytes && <p className="font-mono">max blob {artifact.da.officialMaxBlobBytes} bytes</p>}
      {artifact.da?.stackReason && <p>{artifact.da.stackReason}</p>}
      {artifact.da?.reason && <p>{artifact.da.reason}</p>}
      {artifact.docker && <p className="break-all font-mono">docker installed {String(artifact.docker.installed)} / daemon {String(artifact.docker.daemonReachable)} / compose {String(artifact.docker.composeAvailable)}</p>}
      {artifact.endpoints && <p className="break-all font-mono">da stack grpc {String(artifact.endpoints.daClientGrpc || "missing")} / sidecar {String(artifact.endpoints.sidecarListening)} / client {String(artifact.endpoints.daClientListening)} / encoder {String(artifact.endpoints.encoderListening)} / retriever {String(artifact.endpoints.retrieverListening)}</p>}
      {artifact.tunnel && <p className="break-all font-mono">tunnel sidecar {String(artifact.tunnel.sidecarUrl ?? "missing")} / public {String(artifact.tunnel.configuredPublicSidecar)} / reachable {String(artifact.tunnel.sidecarHealth?.reachable)}</p>}
      {artifact.tunnel?.appUrl && <p className="break-all font-mono">tunnel app {artifact.tunnel.appUrl} / public {String(artifact.tunnel.configuredPublicApp)} / reachable {String(artifact.tunnel.appHealth?.reachable)}</p>}
      {artifact.cloudflared && <p className="break-all font-mono">cloudflared installed {String(artifact.cloudflared.installed)} {artifact.cloudflared.version ?? artifact.cloudflared.reason ?? ""}</p>}
      {artifact.costModel && <p className="break-all font-mono">cloudflare paid min ${String(artifact.costModel.workersPaidMinimumUsdPerMonth ?? "?")} / requests {String(artifact.costModel.requestsIncludedPerMonth ?? "?")} / overage ${String(artifact.costModel.requestsOverageUsdPerMillion ?? "?")}/M</p>}
      {artifact.reason && <p>{artifact.reason}</p>}
      {!artifact.txHash && !artifact.mintTxHash && !artifact.rootHash && !artifact.storageUri && !artifact.blobHash && !artifact.bundleHash && !artifact.contentHash && !artifact.encryptedMetadataHash && !artifact.contract && !artifact.checks && !artifact.reason && <p>Artifact exists without a chain/storage hash.</p>}
    </div>
  );
}
