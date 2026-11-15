# Sakipa Satellite — Rules (v4)

Each player runs a small space agency. You take on missions, choose an orbit, build a CubeSat to carry them out, launch it, and earn Science Points (SP) from the data it sends back.

**Winning.** The first player to reach 10 SP wins (8 SP for a shorter game). If nobody gets there, the game ends after round 6: satellites still in orbit publish partial science (see Phase 3), then the player with the most SP wins. If there's a tie, the player with more budget left wins (good engineering is cheap engineering).

Every decision is a trade-off between three things, shown on each player's Trade Space meter:

- **Cost:** how much budget the design uses
- **Science:** how many SP it can earn
- **Risk:** how likely it is to fail at launch

You can never max out all three. That's the lesson of the game.

## 1. Resources

- **Budget Credits (BC):** money. 1 BC is about $100,000 in real-mission terms. Each player starts with 20 BC and gets +5 BC at the start of every round (their yearly funding).
- **Volume (U):** how much fits inside the CubeSat. It depends on the frame: 1U, 3U, 6U or 12U. 1U is a 10 cm cube.
- **Power (W):** solar parts make power; instruments, radios and other parts use it. Power used can never be more than power made.
- **Data:** what your instruments collect. It only becomes SP once it is sent back to Earth through an antenna.

## 2. The cards (106 cards)

| Type | Count | What it does |
|---|---|---|
| Mission | 20 + 1 co-op | A job: needed orbit, instrument, Data and SP reward |
| Orbit | 6 | Always face up. Sets launch cost, sunlight, base risk and comms |
| Part | 45 | What you build from: cost (BC), size (U), power (W) |
| Event | 20 | One drawn each round; affects everyone |
| Fact | 14 | Real Science field notes (pop-ups in the digital version) |

Every mission, orbit and part card has a Real Science line with a link to its source. This is where the scientific documentation lives inside the game.

### Orbits

| Orbit | Launch | Sun | Base risk | Comms | Needs |
|---|---|---|---|---|---|
| Low Earth Orbit (LEO) | 2 BC | Medium | 1 | Fast | Lasts 3 rounds, including launch (drag) |
| Sun-synchronous (SSO) | 3 BC | High | 1 | Fast | — |
| Geostationary (GEO) | 6 BC | High | 2 | Fast | — |
| Lunar orbit | 8 BC | High | 3 | Slow | Electric thruster |
| Sun–Earth L2 | 9 BC | Very high | 2 | Slow | Electric thruster + high-gain antenna |
| Mars transfer | 12 BC | Low | 3 | Very slow | Electric thruster + high-gain antenna. Advanced play only |

**Sunlight changes your power.** Each solar part (body-mounted cells or deployable panels) makes its printed watts in Medium sun, +1 W in High sun, +2 W in Very high sun, and half (rounded down) in Low sun.

### Parts: the Workshop shelf and the Market

Parts come in two groups:

- **Workshop shelf (always available, any number):** 1U/3U/6U/12U frames, body-mounted cells, deployable panels, battery, UHF antenna, S-band radio.
- **Market (5 face-up cards from the Special deck):** thermal camera ×2, multispectral camera ×2, radiation detector ×2, small telescope ×2, magnetometer ×2, solar sail module, high-gain X-band antenna ×2, reaction wheels ×2, magnetorquers, cold-gas thruster ×2, electric thruster ×2, radiation shielding ×2, redundant computer ×2. When a part is bought, refill the Market straight away. Scrapped parts and parts from retired satellites go to the bottom of the Special deck.

Part notes:

- **Reaction wheels** point the instrument precisely: the satellite collects 2 Data per round instead of 1.
- **Body-mounted cells** take no volume but need frame surface: a 1U frame fits 1, 3U fits 2, 6U fits 3 and 12U fits 4. For more power, use deployable panels.
- **Magnetorquers** work only in LEO or SSO (they push against Earth's magnetic field). They count as attitude control but collect at the normal rate.
- **Radiation shielding** and **redundant computer** each lower Risk by 1.
- **Ground Station Pass** and **Extra Ground Pass** both give every working satellite a downlink, even off-schedule. Ground Station Pass uses a big ground dish, so UHF satellites send all their stored Data; Extra Ground Pass uses the satellite's own antenna, so UHF still sends at most 2.
- **Cold-gas thruster** protects against Space Debris Warning. **Electric thruster** is needed for lunar orbit, L2 and Mars.

## 3. Setup

1. Each player picks an agency name and takes 20 BC.
2. Deal 2 Mission cards to each player. Keep one, put the other back.
3. Lay out the 6 Orbit cards face up and the Workshop shelf.
4. Shuffle the Special deck and lay 5 cards face up. This is the Market.
5. Shuffle the Event deck.
6. Choose the first Mission Lead at random (on the table: the youngest player).

## 4. How a round works

### Phase 1 — Event

The Mission Lead draws the top Event card. Its effect applies to everyone, right away or for the whole round as printed. Then every player collects +5 BC.

### Phase 2 — Player turns

Starting with the Mission Lead and going clockwise, each player takes a turn of **4 actions** (**5 in round 1**, enough to build and launch a first satellite straight away). You can repeat an action.

| Action | Cost | What it does |
|---|---|---|
| Take a Mission | 1 action | Draw 2 Mission cards, keep 1. You can have at most 2 missions open. |
| Buy a Part | 1 action | Pay its price and install it in the satellite you're building. Buy a frame first; each part must fit the frame's volume. |
| Special Order | 1 action | Pay a part's price +2 BC to take any named part from the Special deck. |
| Run a Trade Study | 1 action, 1 BC | Look at the top 3 Special cards and swap one into the Market, **or** look at the next Event card. |
| Launch | 1 action | Pay the orbit's launch cost. The satellite must pass the Design Review. You may also buy launch insurance (below). |

Free (no action): choosing the mission and orbit for the satellite you're building (locked once the first part is installed), scrapping an installed part (no refund), and trading with another agency.

**Trade.** On your turn, offer another agency any BC and/or one installed part (not a frame) from your satellite, for any BC and/or one installed part from theirs. They accept or decline. A part only moves if it still fits the satellite receiving it.

**Launch insurance.** When you launch, you may pay a premium of 10% of the satellite's value (parts + launch, rounded up). If the satellite is lost at the launch check, you get half its value back (rounded down). It pays off when the fail chance is above 20%. Real agencies insure launches the same way.

**One satellite per mission.** Each satellite carries out one mission. You build one satellite at a time; once it has launched you can start the next.

**Design Review** (checked before you can launch; the digital version checks it for you and says what's missing):

- Total size ≤ frame size (U)
- Body-mounted cells ≤ the frame's surface (1U: 1, 3U: 2, 6U: 3, 12U: 4)
- Power made ≥ power used (after the orbit's sunlight)
- It has the instrument the mission needs
- It has an antenna (L2 and Mars: a high-gain antenna)
- It has an electric thruster, if the orbit needs one
- Magnetorquers only in LEO or SSO

**Rideshare.** If two players launch to the same orbit in the same round, they split the launch cost: the second player pays half (rounded up) and the first gets half back (rounded down).

### Phase 3 — Operations and scoring

For every satellite that launched this round or is already in orbit:

1. **Launch check (launch round only).** Risk = orbit's base risk, +1 with no battery, +1 with no attitude control (reaction wheels or magnetorquers), −1 for radiation shielding, −1 for a redundant computer. Minimum 1. Roll a d10: if the roll is higher than Risk, the satellite works. If not, it's lost; the mission stays open so you can try again.
2. **Collect Data.** 1 Data per round, or 2 with reaction wheels.
3. **Downlink.** Stored Data is sent home: a UHF antenna sends at most 2 Data per pass; S-band and high-gain send everything. Fast comms: every round. Lunar orbit: every round with a high-gain antenna, otherwise every other round. Mars: every other round.
4. **Score.** When a mission's downlinked Data reaches its target, you earn its SP and the satellite retires. Its Special parts go to the bottom of the Special deck.
5. **Partial science (end of round 6 only, if nobody reached the target).** Every satellite still in orbit scores the same share of its mission's SP as the share of Data already home, rounded down. Example: 2 of 3 Data home on a 4 SP mission = 2 SP. Real missions publish partial results too.

A LEO satellite that hasn't finished after 3 rounds re-enters the atmosphere; the mission stays open.

Then the Mission Lead passes clockwise and a new round starts.

## 5. Playing with other people

- **Players:** 1–4. Best with 2–3.
- **Guided first satellite (digital):** on by default. A "Next step" tip walks each agency through frame, instrument, antenna, power and launch until its first launch, and highlights the button to press. Turn it off at setup or with "Hide tips".
- **Hot-seat:** players pass one device. The screen shows "Agency X, your turn" before revealing the hand.
- **Online (planned):** each player on their own device, with a 90-second turn timer.
- **Interaction:** a shared Market (if you buy a part, nobody else can have it), rideshares, and trading parts or BC on your turn (free).
- **Co-op (2–4 agencies):** everyone builds one Flagship Observatory at L2 (6 Data, 20 SP). Finish it before round 6 ends and every agency wins.
  - **Subsystems.** Each agency owns some subsystems and may only buy those parts: Payload & pointing (instruments, reaction wheels, magnetorquers), Communications (antennas and radios), Propulsion (thrusters), Power & structure (frames, solar, battery, shielding, backup computer). With 2 agencies each owns two; with 3, one agency owns two.
  - **One budget.** The team starts with 24 BC and gets 7 BC per round, split as evenly as possible between agencies. Use Trade to pass BC to whoever needs it.
  - **Class A.** Real flagship missions are built to the highest reliability class, called Class A: the Flagship's Risk must be 1 to pass the Design Review.
  - The agency that owns Power & structure is the first Mission Lead, so the frame goes in first. Any agency may launch the Flagship. If it is lost, the team builds a new one.
- **Solo:** play alone against the Event deck. Try to reach 10 SP in 6 rounds.

## 6. The Trade Space debrief

At the end of each mission, whether it worked or failed, the game shows a debrief. It places your design on a Cost–Science–Risk chart next to alternative designs for the same mission (for example "cheaper but riskier" or "safer but costlier") and explains what real engineers would have weighed up.

## 7. Quick reference

1. Mission Lead draws an Event. Everyone gets +5 BC.
2. Each player takes 4 actions, 5 in round 1 (Mission, Buy, Special Order, Trade Study, Launch). Trading is free.
3. Launch checks, collect Data, downlink, score.
4. Pass the Mission Lead clockwise.
5. First to 10 SP wins, or most SP after round 6 (after partial science).

## What changed from v3

Measured with `sim.js` (1,500 bot games per setting). Bots now reach 10 SP in 20% / 34% / 53% of solo / 2-player / 4-player games (v3: 4% / 9% / 14%).

- **Partial science at the end.** A quarter of all satellites used to be still in orbit, unscored, when round 6 ended; satellites launched in round 6 finished only 5% of the time. Now they publish what they already sent home. The build bay warns when a satellite can't finish in the rounds left and shows what it would still score.
- **5 actions in round 1.** Nobody could launch in round 1 before (frame, instrument, antenna and power use all 4 actions).
- **Deep space pays.** Moon missions +2 SP (6→8), L2 missions +1 SP (Deep-Sky Watch 9, Cluster Portrait 8, Nebula Survey 9). Measured SP per 10 BC spent was 1.0 at the Moon and 1.3 at L2 against 1.6–1.7 nearer Earth; now all orbits land at 1.7–2.0. Card art reprinted to match.
- **Launch insurance**, **trading** and the **co-op Flagship** are playable (rules above). Co-op is tuned so bots finish the Flagship in 58–73% of games.
- Card art: the corner code now reads SS (it said LW, for Launch Window), and the UHF Antenna cards print the corrected Real Science line.
- Digital version: players are marked by shape as well as colour; dialogs keep keyboard focus inside and close with Escape; the Trade Space bars measure against your budget and the win target.

## What changed from v2

- Renamed to Sakipa Satellite.
- Win target lowered from 15 SP to 10 SP (shorter game: 8). Simulated games never reached 15: one satellite at a time plus 2–3 rounds of data collection caps a player at about 6–8 SP over 6 rounds.
- No discard pile: Special parts that are scrapped or come home with a retired satellite go to the bottom of the Special deck, so the 2 copies of each camera keep circulating.
- The digital version guides each agency through its first satellite.
- Digital version: a card library on the title screen (flip through all cards before playing), an orbit map with real distances, animated event draws, card deals, launches and dice rolls, and a visual operations report.
- UHF Antenna's Real Science line corrected: CubeSat UHF antennas radiate in almost every direction; they are not directional.
- Ground Station Pass now lifts the UHF 2-Data limit; before, it did exactly the same as Extra Ground Pass.
- Added a second radiation shielding, redundant computer and cold-gas thruster (same card art; 106 cards). With one copy each, Spare Electronics and Space Debris Warning rarely mattered, and the debrief's "Safer option" asked for parts only one player could ever own.
- Body-mounted cells are capped by frame surface (1U: 1, 3U: 2, 6U: 3, 12U: 4). Before, cells took no volume and had no limit, so a 1U frame with 10 cells made 40 W and deployable panels were never worth buying.

## What changed from v1

- 4 actions per turn; buying a part installs it (was: buy and install as separate actions). Choosing an orbit is free.
- Risk counts missing systems instead of every part, and is checked once, at launch.
- Basic parts are always available on a Workshop shelf; only special parts go through the Market. Added Special Order and a second telescope and magnetometer.
- One satellite per mission; a lost satellite leaves its mission open.
- Sunlight now changes solar power.
- Trade Study can peek at the next Event (the exact launch chance is now always shown).
- Mars needs an electric thruster and high-gain antenna.
- Removed "First to complete" missions (each mission card belongs to one player).
- The grant event's name now matches its card: Research Grant.
- Magnetorquers work in LEO and SSO.
- Corrected Real Science lines on Polar Field Survey, Equatorial Field Map, Particle Patrol, Lunar Orbit and Mars Transfer.
