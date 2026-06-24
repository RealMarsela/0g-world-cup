import { Link } from "react-router-dom";

const proofPoints = [
  ["01", "Draft integrity", "Full XI drafts come from an 8,379 player historical World Cup pool with room-level commitments."],
  ["02", "0G artifacts", "0G Storage mirrors player snapshots, draft logs, match transcripts, and proof receipts."],
  ["03", "Agent layer", "Agentic ID metadata is encrypted, stored on 0G Storage, and minted for identity-bound AI players."],
];

const chapters = [
  ["01", "Draft", "Humans and AI agents pick full national-team XIs from a shared historical pool."],
  ["02", "Simulate", "Solo, 1v1, group tournaments, and testnet wagers become playable room formats."],
  ["03", "Prove", "Result pages expose hashes, receipts, storage artifacts, and settlement state."],
  ["04", "Share", "Players export a result card with a proof trail voters can inspect."],
];

export function Pitch() {
  return (
    <div className="space-y-12">
      <section className="grid min-h-[calc(100vh-9rem)] gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div className="space-y-7">
          <Link to="/" className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
            0G World Cup / judge deck
          </Link>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.92] text-strong md:text-7xl">
            Fantasy football becomes a verifiable AI arena.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted">
            0G World Cup turns the easiest sports argument in the world, who makes the best XI,
            into a room-based game with commitments, storage receipts, wagers, and agent identity.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-md bg-accent px-5 py-3 text-sm font-bold text-black" to="/room/create">
              Create judge room
            </Link>
            <a className="rounded-md border border-white/15 px-5 py-3 text-sm font-bold" href="/demo.mp4">
              Watch demo cut
            </a>
          </div>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-lg border border-white/12 bg-black shadow-2xl shadow-accent/10">
          <img src="/cover.jpg" alt="0G World Cup draft" className="h-full min-h-[440px] w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/88 to-transparent p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">Demo focus</p>
            <p className="mt-2 max-w-xl text-2xl font-black leading-tight">
              Draft XI, simulate the match, inspect the proof packet, share the result.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {chapters.map(([number, label, text]) => (
          <article key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <p className="text-5xl font-black text-accent">{number}</p>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.22em] text-muted">{label}</p>
            <h2 className="mt-4 text-2xl font-black leading-tight text-strong md:text-3xl">{text}</h2>
          </article>
        ))}
      </section>

      <section className="border-y border-white/10 py-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <h2 className="max-w-3xl text-3xl font-black md:text-5xl">What judges can verify</h2>
          <a className="rounded-md border border-white/15 px-5 py-3 text-sm font-bold" href="/demo.mp4">
            /demo.mp4
          </a>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {proofPoints.map(([number, label, point]) => (
            <div key={number} className="rounded-md border border-white/10 bg-white/[0.04] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
                {number} / {label}
              </p>
              <p className="mt-4 leading-7 text-muted">{point}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
