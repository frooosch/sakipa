# Sakipa Satellite — analysis of Launch Window v2

Baseline: `index.html` (UI, ~810 lines) + `engine.js` (rules, no DOM, seeded RNG, runs in Node) + `cards.json` (103 cards) + 103 card images (8.4 MB webp).
Architecture is good: the engine is separate from the UI and deterministic, which made the balance sim (`node sim.js [games] [players]`, `SAFE=1` for a bot that buys battery + attitude control) possible.

## 1. Balance (biggest problem)

Greedy bots, 1000–2000 games each:

| Setup | Reached 15 SP | Avg best SP |
|---|---|---|
| Solo, lean bot | 0% | 4.9 |
| Solo, safe bot | 0% | 4.6 |
| 2 players / 4 players | 0% | 6.3 / 7.0 |
| 6 actions/turn | 0% | 4.7 |
| 8 rounds | 0% | 5.4 |
| +5 BC more funding (10/round) | 0.1% | 5.0 (45 BC unspent) |
| Max 3 open missions + reaction wheels | 0% | 6.4 |

- **The 15 SP win is out of reach.** Every game ends at round 6. Players never hit the headline goal, and solo always shows "wins!".
- **Money isn't the limit, and neither are actions.** Throughput is: one satellite built at a time, 5–6 actions per satellite, and 2–3 rounds of operations before it scores. Satellites launched in rounds 5–6 can't finish.
- **Deep-space missions are traps.** L2 runs about 29 BC with roughly 60% launch odds and needs 4+ rounds of data. Only 19–38% of L2 launches completed. Cheap LEO/SSO missions dominate.
- **Reaction wheels are the strongest upgrade** (+40% SP). The debrief should teach that.

Fixes to try (re-run `sim.js` after each one):
- Lower the target to ~8–10 SP, or scale it by mission count.
- Count data collection from the launch round for wheels. Another option: let a working satellite score as soon as Data is downlinked, mid-round.
- Let players build 2 satellites in parallel, or make "Buy a part" cover up to 2 Workshop-shelf parts.

## 2. Rules and engine bugs

- **Unlimited free power:** body-mounted cells are 0 U and unlimited. A 1U frame with 10 cells makes 40 W for 11 BC. That makes Deployable Panels pointless and breaks the power trade-off. Cap cells per frame (for example 1U→2, 3U→4, 6U→6, 12U→8).
- **Debrief "Safer option" is often impossible.** It recommends shielding + a redundant computer, but only 1 copy of each exists in the deck.
- **Dead or duplicate events:** Event-08 Ground Station Pass and Event-20 Extra Ground Pass do the same thing. Event-14 Spare Electronics only affects the single redundant computer. Event-02 Space Debris only matters to LEO satellites, and there's only 1 cold-gas thruster.
- **Solo game over** always says "<name> wins!", even when you miss the target.
- **Free first draft with an empty Mission deck** opens a modal with no buttons (soft lock). Rare, but possible in 4-player long games.
- **Rules promise features that aren't built:** trading parts/BC between players, the co-op Flagship variant (the card exists but the engine filters it out), and online play.

## 3. UI / UX

- Branding still says **Launch Window**: `<title>`, title screen, header, save key `launch-window-save-v2`, `RULES.md`, engine comment.
- No onboarding: the first screen is a dense console. A guided first round would help (highlight frame → instrument → antenna → power → launch).
- The Trade Space bars use magic caps (cost/35, science/9), so they don't mean much to a player.
- A11y: modals don't trap focus, and Escape only works when focus is inside the scrim.
- Depends on Google Fonts. Self-host or add fallbacks so the demo works offline.

- **Fixed:** the in-game header (title, round, event, scores, Rules / New game) was clipped to a thin strip. The Data bar reused the CSS class `bar` that the header also had, squashing it to 10 px.
- **Fixed:** less text, more visuals — card library, orbit map, shuffle/flip/deal/launch/dice animations, visual operations report, part thumbnails, plain-language labels.

## 4. Suggested order

1. ~~Rename to Sakipa Satellite~~ done.
2. ~~Win target / pacing~~ done (v3): target 10 SP (8 short), Special parts recycle to the deck bottom. Bots now reach 10 SP in 4–13% of games and 8 SP in 26–55%; bots skip reaction wheels in LEO/SSO, so humans should do better. If playtests show 10 is still too hard, raise base Data per round next.
3. ~~Cap body-mounted cells~~ done (1U: 1, 3U: 2, 6U: 3, 12U: 4; cheap builds unaffected, heavy LEO and Mars builds now need panels). ~~Duplicate/dead events and the debrief's unavailable parts~~ done: Ground Station Pass lifts the UHF cap; second copies of shielding, computer and cold-gas thruster.
4. ~~Solo loss screen + empty-deck guard~~ done. (The empty-deck soft lock could not actually happen with the current 19-mission deck: the free draft only runs on each player's first turn. The guard is there in case the mission set shrinks.)
5. ~~Onboarding~~ done: a "Next step" coach derived from the Design Review state, shown until an agency's first launch.
6. Co-op variant / trading, if time allows.
