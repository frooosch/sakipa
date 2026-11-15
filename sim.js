// Balance sim: greedy bots play N games through the real engine. `node sim.js [games] [players]`
// ponytail: naive greedy bot (cheapest viable design, no wheels/backups); smarter bots if we tune balance seriously.
const LW = require('./engine.js'), CARDS = require('./cards.json');
const N = +process.argv[2] || 2000, P = +process.argv[3] || 1;

function plan(s, b) {
  const m = LW.card(b.missionId), o = LW.orbitCard(b.orbit).rules;
  const want = [m.rules.payload, o.requires.includes('hga') ? 'hga' : 'uhf', ...o.requires.filter(k => k !== 'hga')];
  if (b.missionId === LW.COOP_MISSION) want.push('battery', 'wheels', 'shielding');
  if (process.env.SAFE) want.push('battery', ['leo', 'sso'].includes(b.orbit) ? 'magnetorquers' : 'wheels');
  const frameFor = ks => { const v = ks.reduce((a, k) => a + LW.partCard(k).rules.volume, 0); return v <= 1 ? 'frame1' : v <= 3 ? 'frame3' : v <= 6 ? 'frame6' : 'frame12'; };
  const used = want.reduce((a, k) => a - Math.min(0, LW.partCard(k).rules.power), 0), cellW = LW.solarOutput(3, b.orbit);
  // cells are capped by frame surface; plan a deployable panel when they can't cover the load
  if (LW.partCard(frameFor(want)).rules.cellSlots * cellW < used) want.push('panels');
  return [frameFor(want), ...want];
}
function step(s) {
  const pi = LW.current(s), p = s.players[pi];
  if (s.pending && s.pending.type === 'draft') {
    const best = s.pending.offer.slice().sort((a, b) => score(b) - score(a))[0];
    return LW.act(s, { type: 'keepMission', id: best });
  }
  if (s.actionsLeft < 1) return LW.act(s, { type: 'endTurn' });
  const b = LW.buildOf(s, pi);
  if (s.coop && !b) return LW.act(s, { type: 'endTurn' });
  const idle = !b && p.missions.find(id => !LW.satForMission(s, id));
  if (idle) return LW.act(s, { type: 'selectBuild', missionId: idle });
  if (!b) return p.missions.length < LW.MAX_MISSIONS && LW.act(s, { type: 'takeMission' }).ok ? { ok: true } : LW.act(s, { type: 'endTurn' });
  const have = b.parts.map(x => x.key);
  let need = plan(s, b).filter(k => !have.includes(k));
  // co-op: an agency may only buy its own subsystems; skip ahead to the first one it owns
  // co-op bots pool money: if I have nothing left to buy, hand my BC to a teammate who does
  if (s.coop && !need.some(k => LW.canBuy(s, pi, k)) && p.bc > 0) {
    const mate = s.players.findIndex((q, i) => i !== pi && need.some(k => q.roles.includes(LW.roleOf(k))));
    if (mate >= 0) { const r = LW.act(s, { type: 'trade', to: mate, giveBC: p.bc }); if (r.ok) return r; }
  }
  if (s.coop) { need = need.filter(k => LW.canBuy(s, pi, k)); if (!need.length && (LW.designStats(b.parts, b.orbit).made >= LW.designStats(b.parts, b.orbit).used || !LW.canBuy(s, pi, 'cells'))) { const r = LW.act(s, { type: 'launch' }); return r.ok ? r : LW.act(s, { type: 'endTurn' }); } }
  // optional extras (SAFE bot) are skipped when no copy is buyable
  const opt = ['battery', 'magnetorquers', 'wheels'], avail = k => LW.shelfKeys().includes(k) || s.market.some(id => id && LW.card(id).rules.key === k) || s.specialDeck.some(id => LW.card(id).rules.key === k);
  if (need.length && opt.includes(need[0]) && !avail(need[0])) need.shift();
  if (need.length) {
    const k = need[0], slot = s.market.findIndex(id => id && LW.card(id).rules.key === k);
    const a = LW.shelfKeys().includes(k) ? { type: 'buy', source: 'shelf', key: k }
      : slot >= 0 ? { type: 'buy', source: 'market', slot } : { type: 'specialOrder', key: k };
    const r = LW.act(s, a); return r.ok ? r : LW.act(s, { type: 'endTurn' });
  }
  const st = LW.designStats(b.parts, b.orbit);
  if (st.made < st.used) { const r = LW.act(s, { type: 'buy', source: 'shelf', key: st.cells < st.cellSlots ? 'cells' : 'panels' }); return r.ok ? r : LW.act(s, { type: 'endTurn' }); }
  const r = LW.act(s, { type: 'launch' }); return r.ok ? r : LW.act(s, { type: 'endTurn' });
}
function score(id) { const m = LW.card(id).rules, o = LW.orbitCard(m.orbits[0]).rules; return m.sp / (o.launch + 6 + o.requires.length * 4); }

const COOP = !!process.env.COOP;
const res = { wins: 0, sp: [], rounds: [], byOrbit: {}, lost: 0, launched: 0, bc: [] };
for (let g = 0; g < N; g++) {
  const s = LW.createGame(CARDS, { players: Array.from({ length: P }, (_, i) => 'B' + i), seed: g + 1, coop: COOP });
  while (s.phase !== 'over') {
    LW.startRound(s);
    if (s.pending && s.pending.type === 'tech') LW.act(s, { type: 'techPick', key: LW.card(s.market.find(Boolean)).rules.key });
    LW.beginTurns(s);
    let guard = 0;
    while (s.phase === 'turns' && guard++ < 500) step(s);
    LW.runOps(s); if (s.phase !== 'over') LW.endRound(s);
  }
  const best = Math.max(...s.players.map(p => p.sp));
  if (COOP ? s.coopWon : best >= s.winSP) res.wins++;
  res.sp.push(best); res.bc.push(s.players[0].bc); res.rounds.push(s.round);
  s.sats.forEach(x => { const o = res.byOrbit[x.orbit] = res.byOrbit[x.orbit] || { n: 0, done: 0 }; o.n++; if (x.status === 'done') o.done++; });
  s.players.forEach(p => { res.lost += p.stats.lost; res.launched += p.stats.launched; });
}
const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2);
console.log(`${process.env.SAFE ? 'SAFE bot' : 'lean bot'}${COOP ? ' CO-OP' : ''}, ${N} games, ${P} player(s): ${COOP ? 'Flagship finished' : 'reached ' + LW.WIN_SP + ' SP'} in ${(100 * res.wins / N).toFixed(1)}%, avg top SP ${avg(res.sp)}, avg rounds ${avg(res.rounds)}, avg BC left ${avg(res.bc)}`);
console.log(`launches ${res.launched}, lost at launch ${(100 * res.lost / res.launched).toFixed(1)}%`);
console.log('reached SP:', [6, 8, 10, 12, 15].map(t => `${t}: ${(100 * res.sp.filter(x => x >= t).length / N).toFixed(0)}%`).join(', '));
console.log('sats by orbit (launched / completed):', Object.entries(res.byOrbit).map(([k, v]) => `${k} ${v.n}/${v.done}`).join(', '));
console.assert(res.launched > 0, 'bots never launched: engine or bot broken');

// check: the cell cap holds (1U frame fits 1 body-mounted cell)
{ const g = LW.createGame(CARDS, { seed: 1 }); LW.startRound(g); LW.beginTurns(g); LW.act(g, { type: 'keepMission', id: g.pending.offer[0] });
  LW.act(g, { type: 'buy', source: 'shelf', key: 'frame1' });
  console.assert(LW.act(g, { type: 'buy', source: 'shelf', key: 'cells' }).ok, 'first cell should fit');
  console.assert(!LW.act(g, { type: 'buy', source: 'shelf', key: 'cells' }).ok, 'second cell on a 1U frame should be refused'); }

// check: Ground Station Pass (event-08) lifts the UHF cap; Extra Ground Pass (event-20) does not
for (const [ev, want] of [['event-08', 5], ['event-20', LW.UHF_CAP]]) {
  const g = LW.createGame(CARDS, { seed: 1 }); g.round = 1; g.event = ev;
  const m = LW.byType('mission').find(c => c.rules.data >= 4 && !c.rules.coop).id;
  g.sats.push({ id: 't', owner: 0, missionId: m, orbit: 'sso', parts: [{ key: 'uhf', cardId: LW.partCard('uhf').id }], stored: 4, down: 0, opsRounds: 1, status: 'active', history: [] });
  LW.runOps(g);
  console.assert(g.sats[0].down === want, ev + ': expected ' + want + ' Data down, got ' + g.sats[0].down);
}

// check: a first turn with an empty Mission deck leaves no dead-end choice
{ const g = LW.createGame(CARDS, { seed: 1 }); g.missionDeck = []; LW.startRound(g); LW.beginTurns(g);
  console.assert(!g.pending, 'empty mission deck must not open a draft');
  console.assert(LW.act(g, { type: 'endTurn' }).ok, 'player can still end the turn'); }

// check: insurance pays half the satellite's value when it is lost at launch (first seed that loses one)
{ let checked = false;
  for (let seed = 1; seed < 200 && !checked; seed++) {
    const g = LW.createGame(CARDS, { seed }); LW.startRound(g); g.event = null; LW.beginTurns(g); LW.act(g, { type: 'keepMission', id: g.pending.offer[0] });
    const b = g.players[0].build, pl = LW.card(b.missionId).rules.payload, o = LW.orbitCard(b.orbit).rules; g.players[0].bc = 200; g.actionsLeft = 99;
    ['frame12', 'panels', 'panels', o.requires.includes('hga') ? null : 'sband'].filter(Boolean).forEach(k => LW.act(g, { type: 'buy', source: 'shelf', key: k }));
    [pl, ...o.requires].forEach(k => b.parts.push({ uid: k, key: k, cardId: LW.partCard(k).id, paid: 4 }));
    const ins = LW.insurance(g, b, 0), bc0 = g.players[0].bc, lp = LW.launchPrice(g, b.orbit, 0).price;
    if (!LW.act(g, { type: 'launch', insure: true }).ok) continue;
    console.assert(g.players[0].bc === bc0 - lp - ins.premium, 'premium charged');
    const before = g.players[0].bc; LW.runOps(g);
    if (g.sats[0].status === 'lost') { console.assert(g.players[0].bc === before + ins.payout, 'insurance payout on loss'); checked = true; }
  }
  console.assert(checked, 'no lost launch found to check insurance'); }

// check: trading moves BC and parts, and refuses parts that don't fit
{ const g = LW.createGame(CARDS, { players: ['A', 'B'], seed: 4 }); LW.startRound(g); LW.beginTurns(g); g.event = null;
  const a = LW.current(g), o = 1 - a; LW.act(g, { type: 'keepMission', id: g.pending.offer[0] });
  g.players[o].build = { missionId: g.missionDeck[0], orbit: LW.card(g.missionDeck[0]).rules.orbits[0], parts: [{ uid: 'f', key: 'frame1', cardId: LW.partCard('frame1').id, paid: 1 }, { uid: 'bt', key: 'battery', cardId: LW.partCard('battery').id, paid: 1 }] };
  LW.act(g, { type: 'buy', source: 'shelf', key: 'frame3' });
  const bcA = g.players[a].bc, bcB = g.players[o].bc;
  console.assert(LW.act(g, { type: 'trade', to: o, giveBC: 2, getPart: 'bt' }).ok, 'BC-for-part trade');
  console.assert(g.players[a].bc === bcA - 2 && g.players[o].bc === bcB + 2, 'BC moved');
  console.assert(g.players[a].build.parts.some(x => x.uid === 'bt') && !g.players[o].build.parts.some(x => x.uid === 'bt'), 'part moved');
  console.assert(!LW.act(g, { type: 'trade', to: o, getBC: 999 }).ok, 'cannot take more BC than they have'); }

// check: co-op agencies may only buy their own subsystems
{ const g = LW.createGame(CARDS, { players: ['A', 'B'], seed: 5, coop: true }); LW.startRound(g); LW.beginTurns(g); g.event = null;
  const pi = LW.current(g), mine = LW.ROLES[g.players[pi].roles[0]].keys.find(k => LW.shelfKeys().includes(k) && !k.startsWith('frame'));
  const other = LW.ROLES.findIndex((r, i) => !g.players[pi].roles.includes(i));
  const theirs = LW.ROLES[other].keys.find(k => LW.shelfKeys().includes(k));
  console.assert(!g.pending, 'no mission draft in co-op');
  if (theirs) console.assert(!LW.act(g, { type: 'buy', source: 'shelf', key: theirs }).ok, 'other subsystem refused'); }

// check: when round 6 ends with nobody at the target, a satellite still in orbit scores its share of SP
{ const g = LW.createGame(CARDS, { seed: 6 }); g.round = 5; LW.startRound(g); g.event = 'event-12'; // Signal Fade: no downlink this round
  const mid = LW.byType('mission').find(c => !c.rules.coop && c.rules.data === 3 && c.rules.orbits[0] === 'sso').id;
  g.sats.push({ id: 'p', owner: 0, missionId: mid, orbit: 'sso', parts: [{ key: 'uhf', cardId: LW.partCard('uhf').id }], stored: 0, down: 2, opsRounds: 2, status: 'active', history: [] });
  g.phase = 'ops'; LW.runOps(g);
  const want = Math.floor(LW.card(mid).rules.sp * 2 / 3);
  console.assert(g.phase === 'over' && g.players[0].sp === want && g.sats[0].partial === want, 'partial credit: expected ' + want + ' SP, got ' + g.players[0].sp); }
