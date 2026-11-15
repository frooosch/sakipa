# Launch Window — Rules (v2)

Each player runs a small space agency. You take on missions, choose an orbit, build a CubeSat to carry them out, launch it, and earn Science Points (SP) from the data it sends back.

**Winning.** The first player to reach 15 SP wins. If nobody gets there, the player with the most SP after 6 rounds wins. If there's a tie, the player with more budget left wins (good engineering is cheap engineering).

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

## 2. The cards (103 cards)

| Type | Count | What it does |
|---|---|---|
| Mission | 20 + 1 co-op | A job: needed orbit, instrument, Data and SP reward |
| Orbit | 6 | Always face up. Sets launch cost, sunlight, base risk and comms |
| Part | 42 | What you build from: cost (BC), size (U), power (W) |
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
- **Market (5 face-up cards from the Special deck):** thermal camera ×2, multispectral camera ×2, radiation detector ×2, small telescope ×2, magnetometer ×2, solar sail module, high-gain X-band antenna ×2, reaction wheels ×2, magnetorquers, cold-gas thruster, electric thruster ×2, radiation shielding, redundant computer. When a part is bought, refill the Market straight away. If the Special deck runs out, shuffle the discard pile to form a new deck.

Part notes:

- **Reaction wheels** point the instrument precisely: the satellite collects 2 Data per round instead of 1.
- **Magnetorquers** work only in LEO or SSO (they push against Earth's magnetic field). They count as attitude control but collect at the normal rate.
- **Radiation shielding** and **redundant computer** each lower Risk by 1.
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

Starting with the Mission Lead and going clockwise, each player takes a turn of **4 actions**. You can repeat an action.

| Action | Cost | What it does |
|---|---|---|
| Take a Mission | 1 action | Draw 2 Mission cards, keep 1. You can have at most 2 missions open. |
| Buy a Part | 1 action | Pay its price and install it in the satellite you're building. Buy a frame first; each part must fit the frame's volume. |
| Special Order | 1 action | Pay a part's price +2 BC to take any named part from the Special deck. |
| Run a Trade Study | 1 action, 1 BC | Look at the top 3 Special cards and swap one into the Market, **or** look at the next Event card. |
| Launch | 1 action | Pay the orbit's launch cost. The satellite must pass the Design Review. |

Free (no action): choosing the mission and orbit for the satellite you're building (locked once the first part is installed), and scrapping an installed part (no refund).

**One satellite per mission.** Each satellite carries out one mission. You build one satellite at a time; once it has launched you can start the next.

**Design Review** (checked before you can launch; the digital version checks it for you and says what's missing):

- Total size ≤ frame size (U)
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
4. **Score.** When a mission's downlinked Data reaches its target, you earn its SP and the satellite retires. Its Special parts go to the discard pile.

A LEO satellite that hasn't finished after 3 rounds re-enters the atmosphere; the mission stays open.

Then the Mission Lead passes clockwise and a new round starts.

## 5. Playing with other people

- **Players:** 1–4. Best with 2–3.
- **Hot-seat:** players pass one device. The screen shows "Agency X, your turn" before revealing the hand.
- **Online (planned):** each player on their own device, with a 90-second turn timer.
- **Interaction:** a shared Market (if you buy a part, nobody else can have it), rideshares, and trading parts or BC on your turn (free).
- **Co-op variant:** everyone builds one Flagship Observatory at L2 (20 SP) before round 6 ends; each player builds one subsystem.
- **Solo:** play alone against the Event deck. Try to reach 15 SP in 6 rounds.

## 6. The Trade Space debrief

At the end of each mission, whether it worked or failed, the game shows a debrief. It places your design on a Cost–Science–Risk chart next to alternative designs for the same mission (for example "cheaper but riskier" or "safer but costlier") and explains what real engineers would have weighed up.

## 7. Quick reference

1. Mission Lead draws an Event. Everyone gets +5 BC.
2. Each player takes 4 actions (Mission, Buy, Special Order, Trade Study, Launch).
3. Launch checks, collect Data, downlink, score.
4. Pass the Mission Lead clockwise.
5. First to 15 SP wins, or most SP after round 6.

## What changed from v1

- 4 actions per turn; buying a part installs it (was: buy and install as separate actions). Choosing an orbit is free.
- Risk counts missing systems instead of every part, and is checked once, at launch.
- Basic parts are always available on a Workshop shelf; only special parts go through the Market. Added Special Order and a second telescope and magnetometer.
- One satellite per mission; a lost satellite leaves its mission open.
- Sunlight now changes solar power.
- Trade Study can peek at the next Event (the exact launch chance is now always shown).
- Mars needs an electric thruster and high-gain antenna.
- Removed "First to complete" missions (each mission card belongs to one player).
- "NASA Grant" is now "Research Grant", matching the card.
- Magnetorquers work in LEO and SSO.
- Corrected Real Science lines on Polar Field Survey, Equatorial Field Map, Particle Patrol, Lunar Orbit and Mars Transfer.
