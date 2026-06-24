import { Link, useParams } from "react-router-dom";
import { Download, Share2 } from "lucide-react";
import { Badge, Button, Panel } from "../components/ui";
import { ZeroGProofStack } from "../components/ZeroGProofStack";
import { ZeroGRuntimeGate } from "../components/ZeroGRuntimeGate";
import { completeDraft, createRoomFromId, simulate } from "../worldcup/game";

export function Result() {
  const { roomId = "room-free-1v1" } = useParams();
  const room = completeDraft(createRoomFromId(roomId));
  const result = simulate(room);
  const needsComputeResult = room.teams.some((team) => team.kind === "human" || team.kind === "agent") && result.computeAuthority !== "compute";
  const scoreText = result.type === "tournament" ? `${result.homeScore} pts` : `${result.homeScore}-${result.awayScore}`;
  const shareText = encodeURIComponent(`I drafted ${result.winner} in 0G World Cup: ${scoreText}. Proof ${result.simulationHash}`);
  const shareUrl = encodeURIComponent(window.location.href);
  const pngName = `${room.id}-share-card.png`;
  const downloadSharePng = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#07070c");
    gradient.addColorStop(0.55, "#1a090d");
    gradient.addColorStop(1, "#030306");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(242,13,34,0.18)";
    ctx.beginPath();
    ctx.arc(970, 80, 270, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(242,13,34,0.46)";
    ctx.lineWidth = 4;
    ctx.strokeRect(44, 44, 1112, 542);
    ctx.fillStyle = "#f20d22";
    ctx.font = "700 42px Arial";
    ctx.fillText("0G World Cup", 80, 130);
    ctx.fillStyle = "#fff4f2";
    ctx.font = "900 84px Arial";
    ctx.fillText(scoreText, 80, 260);
    ctx.font = "800 42px Arial";
    ctx.fillText(`${result.winner} ${result.type === "tournament" ? "champions" : "wins"}`, 80, 350);
    ctx.fillStyle = "#d5aaa5";
    ctx.font = "500 30px Arial";
    ctx.fillText(`MVP ${result.mvp.name}`, 80, 438);
    ctx.font = "500 24px Arial";
    ctx.fillText(room.wagerAmount === "free" ? "Free battle" : "Testnet wager", 80, 492);
    ctx.fillText("0G proof receipt", 80, 532);
    ctx.font = "500 20px Arial";
    ctx.fillText(result.simulationHash, 80, 566);
    const link = document.createElement("a");
    link.download = pngName;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (needsComputeResult) {
    return (
      <div className="grid gap-5">
        <Panel className="p-5 sm:p-6" data-testid="result-compute-locked">
          <Badge tone="warn">Compute result required</Badge>
          <h1 className="mt-3 text-4xl font-black">Result locked until 0G Compute kickoff</h1>
          <p className="mt-2 max-w-3xl text-muted">
            This room includes a human or registered agent, so the app will not render a winner, MVP, share card, Storage URI, or Chain result from local deterministic simulation.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={`/simulate/${room.id}`}><Button>Open kickoff</Button></Link>
            <Link to={`/proof/${room.id}`}><Button variant="secondary">Open proof</Button></Link>
          </div>
        </Panel>
        <ZeroGRuntimeGate />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <Panel className="overflow-hidden">
        <div className="bg-[radial-gradient(circle_at_top,rgba(242,13,34,0.24),transparent_55%)] p-6 sm:p-8">
          <Badge tone="accent">{room.wagerAmount === "free" ? "Free battle" : "Testnet wager"}</Badge>
          <h1 className="mt-4 text-5xl font-black">{result.winner} {result.type === "tournament" ? "champions" : "wins"}</h1>
          {result.type === "tournament" ? (
            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {result.table?.map((standing, index) => (
                <div className="rounded-md border border-white/10 bg-black/25 p-4" key={standing.team}>
                  <p className="text-xs uppercase tracking-[0.14em] text-faint">#{index + 1}</p>
                  <h2 className="mt-2 text-xl font-bold">{standing.team}</h2>
                  <p className="mt-3 nums text-3xl font-black text-accent">{standing.points} pts</p>
                  <p className="mt-1 text-sm text-muted">GD {standing.goalDifference >= 0 ? "+" : ""}{standing.goalDifference}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <h2 className="text-2xl font-bold">{result.home}</h2>
              <div className="rounded-md border border-accent/35 bg-black/30 px-8 py-5 text-center text-6xl font-black text-accent">{result.homeScore} - {result.awayScore}</div>
              <h2 className="text-2xl font-bold sm:text-right">{result.away}</h2>
            </div>
          )}
          <p className="mt-6 max-w-3xl text-muted">{result.winExplanation}</p>
        </div>
      </Panel>
      <ZeroGProofStack packet={result.proofPacket} />
      <section className="grid gap-4 md:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-2xl font-bold">MVP</h2>
          <p className="mt-2 text-4xl font-black text-accent">{result.mvp.name}</p>
          <p className="mt-2 text-muted">{result.events[0]}</p>
        </Panel>
        <Panel className="p-5">
          <h2 className="text-2xl font-bold">Share</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noreferrer">
              <Button><Share2 size={16} /> X intent</Button>
            </a>
            <Button variant="secondary" type="button" onClick={downloadSharePng}><Download size={16} /> Download PNG</Button>
            <Link to={`/proof/${room.id}`}><Button variant="secondary">Proof</Button></Link>
          </div>
        </Panel>
      </section>
    </div>
  );
}
