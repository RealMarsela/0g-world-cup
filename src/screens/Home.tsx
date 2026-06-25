import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/ui";

const arenaFrames = [
  ["/brand/solo.png", "01", "Draft a full XI"],
  ["/brand/group.jpg", "02", "Survive the group"],
  ["/brand/won-overall.jpg", "03", "Export the receipt"],
] as const;

export function Home() {
  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-lg border border-accent/25 bg-black p-5 shadow-[0_30px_110px_rgba(0,0,0,0.45)] sm:p-8 lg:p-10">
        <video
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.34]"
          autoPlay
          loop
          muted
          playsInline
          poster="/thumbnail.jpg"
        >
          <source src="/brand/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#07070c_0%,rgba(7,7,12,0.88)_38%,rgba(7,7,12,0.35)_100%)]" />
        <div className="brand-rings absolute -left-32 -top-36 h-[34rem] w-[34rem] rounded-full opacity-90" />
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-accent">Quick match</span>
              <span className="rounded-md border border-white/12 bg-white/[0.045] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-muted">Multiplayer rooms</span>
              <span className="rounded-md border border-white/12 bg-white/[0.045] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-muted">AI rivals</span>
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.94] text-balance sm:text-7xl lg:text-8xl">
              The redline World Cup arena for humans and agents.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Draft legends, face friends or AI rivals, watch the match unfold, and share the winner card when the final whistle hits.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/solo"><Button>Start solo run</Button></Link>
              <Link to="/room/create"><Button variant="secondary">Create room</Button></Link>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="relative overflow-hidden rounded-lg border border-accent/25 bg-black">
              <img src="/thumbnail.jpg" alt="0G World Cup stadium trophy" className="aspect-video w-full object-cover opacity-[0.92]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_20%,rgba(7,7,12,0.88))]" />
              <img src="/logo.png" alt="" className="absolute bottom-4 right-4 size-20 rounded-md border border-accent/35 object-cover shadow-[0_0_36px_rgba(242,13,34,0.35)]" />
            </div>
            <div className="grid gap-2 rounded-lg border border-accent/20 bg-black/50 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-red-200">Choose your kickoff</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["Quick Match", "Draft instantly"],
                  ["Friend Room", "Invite a rival"],
                  ["AI Duel", "Challenge an agent"],
                  ["Tournament", "Run the table"],
                ].map(([title, body]) => (
                  <Link
                    className="group rounded-md border border-white/10 bg-white/[0.04] p-3 transition hover:border-accent/45 hover:bg-accent/10"
                    key={title}
                    to={title === "Quick Match" ? "/solo" : "/room/create"}
                  >
                    <p className="text-sm font-black text-strong group-hover:text-white">{title}</p>
                    <p className="mt-1 text-xs text-muted">{body}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="relative mt-6 overflow-hidden rounded-lg border border-accent/20 bg-black">
        <img
          src="/brand/duel.jpg"
          alt="Rival captains face off before the draft"
          className="absolute inset-y-0 left-0 h-full w-full object-cover object-[50%_20%] opacity-[0.36] lg:w-[54%] lg:opacity-[0.64]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,7,12,0.18),#07070c_53%,#07070c_100%)]" />
        <div className="absolute inset-0 hero-grid opacity-45" />
        <div className="relative grid min-h-[520px] gap-6 p-5 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div className="flex min-h-[320px] flex-col justify-end">
            <p className="max-w-sm font-mono text-xs uppercase tracking-[0.26em] text-red-200">
              Messi vs Ramos energy, bottled into a draft room.
            </p>
          </div>
          <div className="grid content-between gap-8">
            <div className="max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">Match trailer</p>
              <h2 className="mt-4 text-4xl font-black leading-[0.94] text-balance sm:text-6xl">
                Pick the myth. Run the room. Own the final whistle.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Legends collide in the draft, agents bring their own tactics, and every match ends with a winner card worth sharing.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {arenaFrames.map(([src, number, label]) => (
                <figure className="group relative min-h-52 overflow-hidden rounded-md border border-accent/18 bg-panel" key={label}>
                  <img src={src} alt="" className="h-full min-h-52 w-full object-cover opacity-72 transition duration-300 group-hover:scale-[1.04] group-hover:opacity-95" />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4">
                    <span className="nums text-5xl font-black text-accent">{number}</span>
                    <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-strong">{label}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/room/create"><Button>Create judge room</Button></Link>
              <Link to="/pitch"><Button variant="secondary">Open pitch deck</Button></Link>
              <Link to="/leaderboard"><Button variant="ghost">View champions</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
