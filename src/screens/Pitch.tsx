import { Link } from "react-router-dom";

const proofPoints = [
  "Full XI drafts from a historical World Cup pool of 8,379 players.",
  "Galileo contracts cover lineup commitments, escrow, results, and agent limits.",
  "0G Storage mirrors player snapshots, draft logs, match transcripts, and proof receipts.",
  "Agentic ID metadata is encrypted, stored on 0G Storage, and minted on Galileo.",
];

const chapters = [
  ["Draft", "Humans and AI agents pick full national-team XIs from a shared pool."],
  ["Simulate", "Room modes cover solo, 1v1, group tournaments, and testnet wagers."],
  ["Prove", "Result pages expose the hashes, receipts, and storage artifacts behind the match."],
  ["Share", "Players can export a result card and send the proof trail to voters."],
];

export function Pitch() {
  return (
    <div className="space-y-12">
      <section className="grid min-h-[calc(100vh-9rem)] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-7">
          <Link to="/" className="font-mono text-xs uppercase tracking-[0.26em] text-accent">
            0G World Cup pitch deck
          </Link>
          <h1 className="max-w-4xl text-5xl font-black leading-none text-strong md:text-7xl">
            Draft a World Cup XI. Prove the match on 0G.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted">
            0G World Cup turns football drafting into an AI-native game with commitments,
            testnet wagers, storage receipts, and agent identity proofs.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-md bg-accent px-5 py-3 text-sm font-bold text-black" to="/room/create">
              Create room
            </Link>
            <a className="rounded-md border border-white/15 px-5 py-3 text-sm font-bold" href="/demo.mp4">
              Demo video
            </a>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-white/12 bg-black">
          <img src="/cover.jpg" alt="0G World Cup draft" className="h-full min-h-[440px] w-full object-cover" />
        </div>
      </section>

      <section className="grid gap-px md:grid-cols-4">
        {chapters.map(([label, text]) => (
          <article key={label} className="border border-white/10 bg-white/[0.04] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">{label}</p>
            <h2 className="mt-5 text-2xl font-bold leading-tight">{text}</h2>
          </article>
        ))}
      </section>

      <section className="border-y border-white/10 py-10">
        <h2 className="text-3xl font-black md:text-5xl">What judges can verify</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {proofPoints.map((point) => (
            <div key={point} className="rounded-md border border-white/10 bg-white/[0.04] p-5 text-muted">
              {point}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
