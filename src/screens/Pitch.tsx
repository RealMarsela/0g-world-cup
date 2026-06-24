import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const matchFlow = [
  ["Draft", "Build a full XI from 8,379 historical World Cup players."],
  ["Simulate", "Run human and agent rooms with match transcripts and result logic."],
  ["Prove", "Expose commitments, storage receipts, agent identity, and settlement state."],
];

const proofRails = [
  ["0G Storage", "Player snapshots, draft logs, match transcripts, and proof packets."],
  ["Galileo", "Lineup commitments, wager escrow, and result receipts."],
  ["Agentic ID", "Encrypted agent metadata tied to identity-bound AI players."],
];

const clipPlan = [
  ["Clip 01", "Create draft room", "/brand/choosing-team-name-formation.jpg"],
  ["Clip 02", "Simulate result", "/brand/won-overall.jpg"],
  ["Clip 03", "Proof packet", "/brand/group.jpg"],
];

function Slide({ num, label, children }: { num: string; label: string; children: ReactNode }) {
  return (
    <section className="grid min-h-screen snap-start place-items-center px-4 py-10">
      <div className="relative min-h-[720px] w-full max-w-7xl overflow-hidden rounded-[10px] border border-red-500/20 bg-[#07070c] shadow-2xl shadow-black/55 md:aspect-video md:min-h-0">
        <div className="absolute left-6 top-6 z-20 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-red-200 md:left-8 md:top-7">
          <img src="/logo.png" alt="" className="size-8 rounded border border-red-500/35 object-cover" />
          <span>{num}</span>
          <span className="h-px w-10 bg-red-500/45" />
          <span>{label}</span>
        </div>
        {children}
      </div>
    </section>
  );
}

export function Pitch() {
  return (
    <div className="-mx-4 -my-6 snap-y snap-mandatory bg-[#050507] text-white">
      <Slide num="01" label="Match thesis">
        <img src="/thumbnail.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.58]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#050507_0%,rgba(5,5,7,0.88)_42%,rgba(5,5,7,0.3)_100%)]" />
        <div className="brand-rings absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full" />
        <div className="absolute left-6 right-6 top-24 max-w-4xl md:left-16 md:right-auto md:top-28">
          <Link to="/" className="font-mono text-xs uppercase tracking-[0.28em] text-red-200">
            0G World Cup
          </Link>
          <h1 className="mt-8 text-[44px] font-black leading-[0.92] md:text-[88px] md:leading-[0.86]">
            Fantasy football becomes a redline AI arena.
          </h1>
          <p className="mt-8 max-w-2xl text-[24px] leading-[1.35] text-white/72 md:text-[27px]">
            Draft the best XI, let humans and agents settle the argument, then show judges the proof trail behind the result.
          </p>
        </div>
        <div className="absolute bottom-10 left-6 flex flex-wrap gap-3 md:bottom-12 md:left-16">
          <Link className="rounded-md bg-red-600 px-5 py-3 text-sm font-black text-white shadow-[0_0_36px_rgba(242,13,34,0.32)]" to="/room/create">
            Create judge room
          </Link>
          <a className="rounded-md border border-white/20 bg-black/30 px-5 py-3 text-sm font-black" href="/demo.mp4">
            Watch demo video
          </a>
        </div>
      </Slide>

      <Slide num="02" label="Why people care">
        <div className="absolute inset-0 bg-[#09080d]" />
        <img src="/brand/duel.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[52%] object-cover opacity-[0.72]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#09080d_0%,#09080d_44%,rgba(9,8,13,0.38)_100%)]" />
        <div className="absolute left-6 top-24 max-w-3xl md:left-16 md:top-28">
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-red-300">Universal sports argument</p>
          <h2 className="mt-8 text-[50px] font-black leading-[0.92] md:text-[76px]">
            Every fan has a best XI. Almost none can prove the game.
          </h2>
        </div>
        <div className="absolute bottom-10 left-6 right-6 grid gap-3 md:bottom-14 md:left-16 md:right-auto md:w-[46%] md:grid-cols-2">
          {["Brazil 1970", "France 1998", "Argentina 2022", "AI XI"].map((team, index) => (
            <div key={team} className="border border-red-500/22 bg-white/[0.055] p-5 shadow-xl shadow-black/20 backdrop-blur">
              <p className="font-mono text-xs text-red-300">Seed 0{index + 1}</p>
              <p className="mt-5 text-[28px] font-black">{team}</p>
              <p className="mt-2 text-[16px] text-white/62">Draftable, sim-ready, proof-linked.</p>
            </div>
          ))}
        </div>
      </Slide>

      <Slide num="03" label="Game loop">
        <div className="absolute inset-0 bg-[#07070c]" />
        <div className="brand-rings absolute inset-12 rounded-[18px] border border-red-500/18" />
        <h2 className="absolute left-6 right-6 top-24 max-w-4xl text-[48px] font-black leading-[0.94] md:left-16 md:right-auto md:top-28 md:text-[78px]">
          Draft, simulate, prove. A full match in three judge-visible moves.
        </h2>
        <div className="absolute bottom-10 left-6 right-6 grid gap-4 md:bottom-16 md:left-16 md:right-16 md:grid-cols-3">
          {matchFlow.map(([title, text], index) => (
            <article key={title} className="min-h-[220px] border border-red-500/25 bg-black/42 p-6 md:min-h-[330px] md:p-8">
              <p className="text-[54px] font-black text-red-500 md:text-[74px]">0{index + 1}</p>
              <h3 className="mt-4 text-[30px] font-black md:text-[36px]">{title}</h3>
              <p className="mt-4 text-[18px] leading-[1.35] text-white/68 md:text-[22px]">{text}</p>
            </article>
          ))}
        </div>
      </Slide>

      <Slide num="04" label="0G proof rails">
        <img src="/brand/world-cup.jpg" alt="" className="absolute inset-y-0 left-0 h-full w-[44%] object-cover opacity-[0.76]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,7,12,0.12),#07070c_43%,#07070c_100%)]" />
        <h2 className="absolute left-6 right-6 top-24 max-w-3xl text-[48px] font-black leading-[0.94] md:left-[48%] md:right-auto md:top-28 md:text-[74px]">
          The proof trail is the product, not a footer.
        </h2>
        <div className="absolute bottom-10 left-6 right-6 grid gap-4 md:bottom-16 md:left-[48%] md:right-16">
          {proofRails.map(([label, text]) => (
            <article key={label} className="border-l-4 border-red-500 bg-white/[0.07] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-red-300">{label}</p>
              <p className="mt-4 text-[24px] font-black leading-tight md:text-[28px]">{text}</p>
            </article>
          ))}
        </div>
      </Slide>

      <Slide num="05" label="Video assets">
        <div className="absolute inset-0 bg-[#0b090d]" />
        <h2 className="absolute left-6 right-6 top-24 text-[46px] font-black leading-[0.94] md:left-16 md:right-auto md:top-28 md:text-[68px]">
          The final cut uses the same red-black match language.
        </h2>
        <div className="absolute bottom-10 left-6 right-6 grid gap-4 md:bottom-16 md:left-16 md:right-16 md:grid-cols-3">
          {clipPlan.map(([clip, title, image]) => (
            <article key={clip} className="min-h-[320px] overflow-hidden border border-red-500/20 bg-black text-white">
              <img src={image} alt="" className="h-44 w-full object-cover opacity-[0.82] md:h-52" />
              <div className="p-6">
                <p className="font-mono text-sm uppercase tracking-[0.24em] text-red-300">{clip}</p>
                <h3 className="mt-5 text-[30px] font-black leading-tight md:text-[34px]">{title}</h3>
              </div>
            </article>
          ))}
        </div>
      </Slide>

      <Slide num="06" label="Close">
        <img src="/brand/final-lost.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-[48%] object-cover opacity-[0.6]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(242,13,34,0.34),transparent_28%),linear-gradient(90deg,#07070c_0%,#07070c_48%,rgba(7,7,12,0.58)_100%)]" />
        <div className="absolute left-6 right-6 top-24 max-w-4xl md:left-16 md:right-auto md:top-28">
          <h2 className="text-[54px] font-black leading-[0.9] md:text-[88px]">
            Playable for fans. Inspectable for judges. Built for agents.
          </h2>
          <p className="mt-8 max-w-3xl text-[23px] leading-[1.35] text-white/70 md:text-[28px]">
            0G World Cup gives the community a fun surface while proving the 0G substrate is actually doing work.
          </p>
        </div>
        <div className="absolute bottom-10 left-6 flex flex-wrap gap-4 md:bottom-16 md:left-16">
          <Link to="/room/create" className="rounded-md bg-red-600 px-6 py-4 text-sm font-black text-white">
            Create room
          </Link>
          <a href="/demo.mp4" className="rounded-md border border-white/20 bg-black/30 px-6 py-4 text-sm font-black">
            View /demo.mp4
          </a>
        </div>
      </Slide>
    </div>
  );
}
