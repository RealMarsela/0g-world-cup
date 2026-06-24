# 0G World Cup Demo Video Plan

Target runtime: 85-95 seconds.
Audience: first-round judges.
Video style: pitch-led product story with short gameplay/proof recordings. Do not use one continuous screen recording.
Final public URL: `https://0g-world-cup.pages.dev/demo.mp4`.

## Storyboard

| Time | Screen | Voiceover |
| --- | --- | --- |
| 00:00-00:06 | Logo, stadium/draft visual, `/pitch` hero. | "Every football fan has the same argument: who makes the best eleven?" |
| 00:06-00:18 | Split screen: draft room, player pool, proof receipt labels. | "0G World Cup turns that argument into an AI-native game where humans and agents draft national-team XIs and every match has a proof trail." |
| 00:18-00:43 | Demo clip 01: create room, choose draft mode, select players. | "A player creates a room, drafts from a historical World Cup pool of more than eight thousand players, and can invite humans or agents into the match." |
| 00:43-01:02 | Demo clip 02: simulate match, result page, export/share card. | "The result is not just a score. The app exposes commitments, match transcript artifacts, storage receipts, and a shareable result card." |
| 01:02-01:20 | Demo clip 03: proof packet and agent identity sections. | "0G matters because the data, agent identity, and settlement trail are inspectable outside the game UI. Judges can follow the proof from draft to result." |
| 01:20-01:30 | Closing title with live URL and repo owner. | "0G World Cup is fantasy football for the agent era: playable, social, and verifiable." |

## Screen Recordings To Capture

Record at 1920x1080, browser zoom 100 percent, cursor visible, no browser bookmarks bar.

1. `worldcup-clip-01-create-draft-room.mp4`
   - URL: `https://0g-world-cup.pages.dev/room/create`
   - Action: create or configure a room, pick the World Cup draft mode, show the player pool and first XI selections.
   - Duration needed in edit: 22-25 seconds.
   - Important framing: keep the draft grid and selected players visible.

2. `worldcup-clip-02-simulate-result.mp4`
   - URL: use the live room/result flow.
   - Action: run simulation, land on result, show final score and result card/share panel.
   - Duration needed in edit: 18-22 seconds.
   - Important framing: pause on the result card before moving to proof.

3. `worldcup-clip-03-proof-packet.mp4`
   - URL: result/proof page or proof artifact screen.
   - Action: scroll through storage, agentic identity, commitment, and receipt sections.
   - Duration needed in edit: 15-18 seconds.

4. `worldcup-clip-04-pitch-proof.mp4`
   - URL: `https://0g-world-cup.pages.dev/pitch`
   - Action: slow scroll from hero to "What judges can verify".
   - Duration needed in edit: 8-10 seconds.

## Voice Recording For Gabriel

Record one clean file named `worldcup-gabriel-voice.wav`.
Pace: energetic, sports-broadcast confident, 140-150 words per minute.

Full script:

"Every football fan has the same argument: who makes the best eleven?

0G World Cup turns that argument into an AI-native game where humans and agents draft national-team XIs and every match has a proof trail.

A player creates a room, drafts from a historical World Cup pool of more than eight thousand players, and can invite humans or agents into the match.

The result is not just a score. The app exposes commitments, match transcript artifacts, storage receipts, and a shareable result card.

0G matters because the data, agent identity, and settlement trail are inspectable outside the game UI. Judges can follow the proof from draft to result.

0G World Cup is fantasy football for the agent era: playable, social, and verifiable."

## Remotion Assembly Notes

Composition: `WorldCupDemo`, 1920x1080, 30 fps, 90 seconds.

Assets:
- `public/video/raw/worldcup-clip-01-create-draft-room.mp4`
- `public/video/raw/worldcup-clip-02-simulate-result.mp4`
- `public/video/raw/worldcup-clip-03-proof-packet.mp4`
- `public/video/raw/worldcup-clip-04-pitch-proof.mp4`
- `public/audio/worldcup-gabriel-voice.wav`

Use stadium-black, grass green, proof cyan, and scoreboard typography. Transitions should feel like match broadcast wipes, but keep proof fields readable.
