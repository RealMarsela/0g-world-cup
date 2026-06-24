# 0G World Cup 4-Minute Demo Video Plan

Target duration: 4:00.
Audience: first-round judges.
Video style: sports-pitch trailer plus live product footage.
Final public URL: `https://0g-world-cup.pages.dev/demo.mp4`.

## Timing

| Time | Scene | Visual direction | Audio file |
| --- | --- | --- | --- |
| 00:00-00:18 | Hook | Trophy, draft cards, match-room headline. | `public/audio/final/worldcup-01-hook.mp3` |
| 00:18-00:45 | Problem | Fan debate, static fantasy games, black-box AI result contrast. | `public/audio/final/worldcup-02-problem.mp3` |
| 00:45-01:12 | Product thesis | Draft, simulate, prove, share loop. | `public/audio/final/worldcup-03-product-loop.mp3` |
| 01:12-01:58 | Footage 01 | Insert `public/video/final/worldcup-01-create-room-draft.mp4`. | `public/audio/final/worldcup-04-demo-draft.mp3` |
| 01:58-02:42 | Footage 02 | Insert `public/video/final/worldcup-02-agents-board-result.mp4`. | `public/audio/final/worldcup-05-demo-match.mp3` |
| 02:42-03:18 | Proof | Insert `public/video/final/worldcup-03-proof-packet.mp4`. | `public/audio/final/worldcup-06-proof.mp3` |
| 03:18-03:42 | Why it wins | Judge checklist: game, agents, proof, community shareability. | `public/audio/final/worldcup-07-judge-case.mp3` |
| 03:42-04:00 | Close | URL, result card, proof badges. | `public/audio/final/worldcup-08-close.mp3` |

## ElevenLabs Script Chunks

Record each chunk as its own MP3. Keep the filenames exactly as listed above.

### 01 Hook

Every football fan has the same argument: who makes the best eleven?

Messi or Maradona. Ronaldo or Mbappe. Brazil flair or Germany structure. These debates are emotional, social, and endless. But online, they usually become comments, polls, or fantasy teams with no real proof behind the result.

0G World Cup turns that argument into a playable AI-native arena: draft the team, run the match, inspect the proof, and share the result.

### 02 Problem

Fantasy sports are popular because they make fans feel like managers. But most fantasy products are locked to current seasons, centralized scoring, and black-box outcomes. They do not handle historical dream teams well, and they definitely do not make AI agents first-class players.

At the same time, agent demos often feel isolated. They show an AI making a decision, but not a game people want to replay or share.

The opportunity is to combine fan culture, AI agents, and verifiable game artifacts into one product loop.

### 03 Product Loop

0G World Cup is built around four steps: create a room, draft an eleven, simulate the match, and inspect the proof.

Players can create rooms, draft from a historical World Cup pool, invite humans or agents, and then watch the result become a shareable artifact. The product works because it is easy to understand even before you explain the infrastructure. Everyone understands football. Everyone understands a best-eleven argument.

0G makes the argument verifiable instead of disposable.

### 04 Demo Draft

Here is the live room and draft flow.

The player starts by creating a match room, choosing the draft setup, and moving into the player pool. The app is designed to feel like a game first: quick selection, visible squads, and a clear path from room creation into match setup.

This matters for judges because the 0G layer is not floating separately from the product. It supports a real fan workflow. The user wants to draft, compete, and share. The proof system is there because it makes that game more credible and replayable.

### 05 Demo Match

After the room is created, the match experience moves through agents, board state, and result surfaces.

This is where 0G World Cup becomes more than fantasy football. AI agents can represent strategies, draft decisions, or match reasoning. The board and result screens make the outcome visible, while the shareable result card gives the community something to react to.

For the first judging rounds, the important thing is that the product has a full loop. It is not just a form, and it is not just a proof page. It is a game from setup to outcome.

### 06 Proof

The proof trail is the reason this belongs in the 0G ecosystem.

A normal game can show a score. 0G World Cup can expose the draft commitment, match artifact, storage receipt, agent identity, and result metadata behind that score. Judges can inspect the path from draft to result instead of trusting a hidden server.

That creates a better game for players and a better platform for future agent competitions. If an agent claims it won, the product can show what happened, what was stored, and how the result was produced.

### 07 Judge Case

For judges, 0G World Cup has three advantages.

First, the concept is instantly understandable: build the best World Cup team and prove the match. Second, it has community energy because football arguments naturally invite sharing and voting. Third, it uses 0G for something users can feel: trust in the game result, not infrastructure for infrastructure's sake.

That makes it strong for judge review now and for community judging later.

### 08 Close

0G World Cup is fantasy football for the agent era: playable, social, and verifiable.

Fans get the debate. Agents get a competitive arena. Judges get an inspectable proof trail.

Live demo: 0g-world-cup.pages.dev.

## Footage To Record

Record at 1920x1080, browser zoom 100 percent, cursor visible, no bookmarks bar, no audio.

1. `worldcup-01-create-room-draft.mp4`
   - URL sequence: `https://0g-world-cup.pages.dev/room/create`, then room/draft flow.
   - Length to record: 60-75 seconds.
   - Show: create/configure room, enter draft, show player pool and selected XI.
   - Important: keep draft grid and selected squad readable.

2. `worldcup-02-agents-board-result.mp4`
   - URL sequence: `/agents`, `/board`, then result/share surface if available.
   - Length to record: 55-70 seconds.
   - Show: agents, board, match/result card, shareable output.
   - Important: pause on the final score or result card.

3. `worldcup-03-proof-packet.mp4`
   - URL sequence: proof/result artifact route, then `/pitch`.
   - Length to record: 35-45 seconds.
   - Show: storage, agent identity, commitments, receipt/proof sections.
   - Important: scroll slowly; proof text must be readable.

## Remotion Assembly Notes

Use sports-broadcast pacing: fast intro, clear scoreboard cards, proof callouts that feel like match analysis. Footage should occupy roughly 1:35-1:50. Use the red-black orbital logo language, trophy gold winner highlights, black stadium atmosphere, and supplied 0G World Cup art pack.
