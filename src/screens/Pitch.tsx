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

function Slide({ num, label, children }: { num: string; label: string; children: ReactNode }) {
  return (
    <section className="grid min-h-screen place-items-center px-4 py-10">
      <div className="relative aspect-video w-full max-w-7xl overflow-hidden rounded-[10px] border border-white/12 bg-[#07110a] shadow-2xl shadow-black/40">
        <div className="absolute left-8 top-7 z-10 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.24em] text-[#d7ff4f]">
          <span>{num}</span>
          <span className="h-px w-14 bg-[#d7ff4f]/35" />
          <span>{label}</span>
        </div>
        {children}
      </div>
    </section>
  );
}

export function Pitch() {
  return (
    <div className="-mx-4 -my-6 snap-y snap-mandatory bg-[#051108] text-white">
      <Slide num="01" label="Match thesis">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(215,255,79,0.22),transparent_26%),linear-gradient(135deg,#051108,#102d18_55%,#06100a)]" />
        <div className="absolute inset-y-0 right-0 w-[47%]">
          <img src="/cover.jpg" alt="0G World Cup draft room" className="h-full w-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#051108]" />
        </div>
        <div className="absolute left-16 top-28 max-w-3xl">
          <Link to="/" className="font-mono text-xs uppercase tracking-[0.28em] text-[#d7ff4f]">
            0G World Cup
          </Link>
          <h1 className="mt-8 text-[88px] font-black leading-[0.86] tracking-tight">
            Fantasy football becomes a verifiable AI arena.
          </h1>
          <p className="mt-8 max-w-2xl text-[27px] leading-[1.35] text-white/70">
            Draft the best XI, let humans and agents settle the argument, then show judges the proof trail behind the result.
          </p>
        </div>
        <div className="absolute bottom-12 left-16 flex gap-3">
          <Link className="rounded-md bg-[#d7ff4f] px-5 py-3 text-sm font-black text-black" to="/room/create">
            Create judge room
          </Link>
          <a className="rounded-md border border-white/20 px-5 py-3 text-sm font-black" href="/demo.mp4">
            Watch demo video
          </a>
        </div>
      </Slide>

      <Slide num="02" label="Why people care">
        <div className="absolute inset-0 bg-[#f2f4e8] text-[#061108]" />
        <div className="absolute left-16 top-28 w-[48%]">
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-[#236c37]">Universal sports argument</p>
          <h2 className="mt-8 text-[76px] font-black leading-[0.9]">Every fan has a best XI. Almost none can prove the game.</h2>
        </div>
        <div className="absolute right-16 top-24 grid w-[40%] grid-cols-2 gap-4">
          {["Brazil 1970", "France 1998", "Argentina 2022", "AI XI"].map((team, index) => (
            <div key={team} className="min-h-[210px] border border-[#061108]/15 bg-white p-6 shadow-xl shadow-black/10">
              <p className="font-mono text-sm text-[#236c37]">Seed 0{index + 1}</p>
              <p className="mt-8 text-[34px] font-black">{team}</p>
              <p className="mt-3 text-[18px] text-[#061108]/60">Draftable, sim-ready, proof-linked.</p>
            </div>
          ))}
        </div>
      </Slide>

      <Slide num="03" label="Game loop">
        <div className="absolute inset-0 bg-[#07110a]" />
        <div className="absolute inset-12 rounded-[18px] border border-[#d7ff4f]/20 bg-[linear-gradient(90deg,rgba(215,255,79,0.08)_1px,transparent_1px),linear-gradient(rgba(215,255,79,0.08)_1px,transparent_1px)] bg-[size:96px_96px]" />
        <h2 className="absolute left-16 top-28 max-w-4xl text-[78px] font-black leading-[0.9]">Draft, simulate, prove. A full match in three judge-visible moves.</h2>
        <div className="absolute bottom-16 left-16 right-16 grid grid-cols-3 gap-5">
          {matchFlow.map(([title, text], index) => (
            <article key={title} className="min-h-[330px] border border-[#d7ff4f]/25 bg-black/35 p-8">
              <p className="text-[74px] font-black text-[#d7ff4f]">0{index + 1}</p>
              <h3 className="mt-5 text-[36px] font-black">{title}</h3>
              <p className="mt-4 text-[22px] leading-[1.35] text-white/68">{text}</p>
            </article>
          ))}
        </div>
      </Slide>

      <Slide num="04" label="0G proof rails">
        <div className="absolute inset-0 bg-[#0b1b12]" />
        <h2 className="absolute left-16 top-28 max-w-3xl text-[74px] font-black leading-[0.92]">The proof trail is the product, not a footer.</h2>
        <div className="absolute right-16 top-28 grid w-[43%] gap-5">
          {proofRails.map(([label, text]) => (
            <article key={label} className="border-l-4 border-[#d7ff4f] bg-white p-7 text-[#07110a]">
              <p className="font-mono text-sm uppercase tracking-[0.24em] text-[#236c37]">{label}</p>
              <p className="mt-4 text-[28px] font-black leading-tight">{text}</p>
            </article>
          ))}
        </div>
      </Slide>

      <Slide num="05" label="Video placeholders">
        <div className="absolute inset-0 bg-[#e7efe3] text-[#061108]" />
        <h2 className="absolute left-16 top-28 text-[68px] font-black leading-[0.92]">The final cut inserts three match clips.</h2>
        <div className="absolute bottom-16 left-16 right-16 grid grid-cols-3 gap-5">
          {[
            ["Clip 01", "Create draft room", "Pick room mode, draft players, show selected XI."],
            ["Clip 02", "Simulate result", "Run the match and pause on final score plus result card."],
            ["Clip 03", "Proof packet", "Scroll through Storage, Galileo, and Agentic ID receipts."],
          ].map(([clip, title, text]) => (
            <article key={clip} className="min-h-[360px] bg-[#07110a] p-7 text-white">
              <p className="font-mono text-sm uppercase tracking-[0.24em] text-[#d7ff4f]">{clip}</p>
              <h3 className="mt-7 text-[34px] font-black leading-tight">{title}</h3>
              <p className="mt-5 text-[22px] leading-[1.35] text-white/68">{text}</p>
              <div className="mt-8 h-24 rounded-md border border-dashed border-[#d7ff4f]/45 bg-[#d7ff4f]/10" />
            </article>
          ))}
        </div>
      </Slide>

      <Slide num="06" label="Close">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(215,255,79,0.3),transparent_30%),#061108]" />
        <div className="absolute left-16 top-28 max-w-4xl">
          <h2 className="text-[88px] font-black leading-[0.88]">Playable for fans. Inspectable for judges. Built for agents.</h2>
          <p className="mt-8 max-w-3xl text-[28px] leading-[1.35] text-white/70">
            0G World Cup gives the community a fun surface while proving the 0G substrate is actually doing work.
          </p>
        </div>
        <div className="absolute bottom-16 left-16 flex gap-4">
          <Link to="/room/create" className="rounded-md bg-[#d7ff4f] px-6 py-4 text-sm font-black text-black">
            Create room
          </Link>
          <a href="/demo.mp4" className="rounded-md border border-white/20 px-6 py-4 text-sm font-black">
            View /demo.mp4
          </a>
        </div>
      </Slide>
    </div>
  );
}
