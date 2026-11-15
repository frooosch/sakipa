/* Sakipa Satellite — rules engine (v3 rules). No DOM. Works in the browser (window.LW) and Node (module.exports). */
(function (root) {
  'use strict';

  var ACTIONS_PER_TURN = 4;
  var START_BC = 20, FUNDING = 5, WIN_SP = 10, ROUNDS = 6, MAX_MISSIONS = 2;
  var SPECIAL_ORDER_FEE = 2;
  var ORBIT_ORDER = ['leo', 'sso', 'geo', 'lunar', 'l2', 'mars'];
  var SUN_BONUS = { medium: 0, high: 1, veryhigh: 2 };
  var UHF_CAP = 2;

  // ---------- RNG (seeded, stored in state so games replay) ----------
  function rand(s) {
    s.rng = (s.rng + 0x6D2B79F5) | 0;
    var t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function d10(s) { return 1 + Math.floor(rand(s) * 10); }
  function shuffle(s, arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rand(s) * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------- card lookups ----------
  var CARDS = {}, BY_TYPE = {}, ORBITS = {}, SHELF = {}, PART_BY_KEY = {};
  function loadCards(list) {
    CARDS = {}; BY_TYPE = {}; ORBITS = {}; SHELF = {}; PART_BY_KEY = {};
    list.forEach(function (c) {
      CARDS[c.id] = c;
      (BY_TYPE[c.type] = BY_TYPE[c.type] || []).push(c);
      if (c.type === 'orbit') ORBITS[c.rules.code] = c;
      if (c.type === 'part') {
        if (!PART_BY_KEY[c.rules.key]) PART_BY_KEY[c.rules.key] = c;
        if (c.rules.shelf === 'workshop' && !SHELF[c.rules.key]) SHELF[c.rules.key] = c;
      }
    });
  }
  function card(id) { return CARDS[id]; }
  function orbitCard(code) { return ORBITS[code]; }
  function partCard(key) { return PART_BY_KEY[key]; }
  function shelfKeys() { return Object.keys(SHELF); }
  function eventIs(s, id) { return s.event === id; }

  // ---------- game creation ----------
  function createGame(cards, opts) {
    loadCards(cards);
    opts = opts || {};
    var s = {
      v: 2, funding: opts.funding || FUNDING, winSP: opts.winSP || WIN_SP, rng: (opts.seed == null ? Math.floor(Math.random() * 2e9) : opts.seed) | 0,
      advanced: !!opts.advanced, round: 0, phase: 'event', lead: 0, order: [], turnPos: 0,
      actionsLeft: 0, event: null, players: [], sats: [], satSeq: 0, uidSeq: 0,
      missionDeck: [], specialDeck: [], market: [], eventDeck: [],
      techDiscount: {}, launches: {}, pending: null, log: [], debriefs: [], reports: [],
      peekedEvent: null, winner: null, factsSeen: {}
    };
    var names = opts.players && opts.players.length ? opts.players : ['Agency 1'];
    names.forEach(function (n, i) {
      s.players.push({ name: n, bc: START_BC, sp: 0, missions: [], build: null, drafted: false, peerReviewUsed: false, stats: { launched: 0, lost: 0, completed: 0 } });
    });
    s.missionDeck = shuffle(s, BY_TYPE.mission.filter(function (c) {
      return !c.rules.coop && (s.advanced || !c.rules.advanced);
    }).map(function (c) { return c.id; }));
    s.specialDeck = shuffle(s, BY_TYPE.part.filter(function (c) { return c.rules.shelf === 'market'; }).map(function (c) { return c.id; }));
    for (var i = 0; i < 5; i++) refillSlot(s, i);
    s.eventDeck = shuffle(s, BY_TYPE.event.map(function (c) { return c.id; }));
    s.lead = Math.floor(rand(s) * s.players.length);
    log(s, 'Mission Lead for round 1: ' + s.players[s.lead].name + '.');
    return s;
  }

  function log(s, msg, who) { s.log.push({ round: s.round, msg: msg, who: who == null ? null : who }); if (s.log.length > 200) s.log.shift(); }

  function drawSpecial(s) {
    return s.specialDeck.shift() || null;
  }
  function refillSlot(s, i) { s.market[i] = drawSpecial(s); }

  // ---------- rounds ----------
  function startRound(s) {
    s.round += 1; s.phase = 'event'; s.launches = {}; s.rideRefunded = {}; s.reportsThisRound = null;
    s.players.forEach(function (p) { p.peerReviewUsed = false; });
    if (!s.eventDeck.length) s.eventDeck = shuffle(s, BY_TYPE.event.map(function (c) { return c.id; }));
    s.event = s.eventDeck.shift(); s.peekedEvent = null;
    var ev = card(s.event);
    log(s, 'Round ' + s.round + ' event: ' + ev.title + '.');
    if (eventIs(s, 'event-04')) {
      s.players.forEach(function (p) { p.bc = Math.max(0, p.bc - 3); });
      log(s, 'Budget Cut: every agency loses 3 BC.');
    }
    if (eventIs(s, 'event-06')) {
      var min = Math.min.apply(null, s.players.map(function (p) { return p.sp; }));
      s.players.forEach(function (p) { if (p.sp === min) { p.bc += 5; log(s, 'Research Grant: ' + p.name + ' gains 5 BC.'); } });
    }
    s.players.forEach(function (p) { p.bc += s.funding; });
    s.order = [];
    for (var i = 0; i < s.players.length; i++) s.order.push((s.lead + i) % s.players.length);
    s.turnPos = 0;
    s.pending = null;
    if (eventIs(s, 'event-07') && s.market.some(Boolean)) s.pending = { type: 'tech', player: s.lead };
    return ev;
  }

  function beginTurns(s) { s.phase = 'turns'; s.actionsLeft = ACTIONS_PER_TURN; startTurnFor(s); }
  function current(s) { return s.order[s.turnPos]; }
  function startTurnFor(s) {
    var p = s.players[current(s)];
    s.actionsLeft = ACTIONS_PER_TURN;
    if (!p.drafted) {
      p.drafted = true;
      s.pending = { type: 'draft', player: current(s), offer: drawMissions(s, 2), free: true };
    }
  }
  function drawMissions(s, n) { var out = []; while (out.length < n && s.missionDeck.length) out.push(s.missionDeck.shift()); return out; }

  // ---------- derived values ----------
  function solarOutput(base, orbit) {
    if (!orbit) return base;
    var sun = orbitCard(orbit).rules.sun;
    if (sun === 'low') return Math.floor(base / 2);
    return base + (SUN_BONUS[sun] || 0);
  }
  function hasKey(parts, k) { return parts.some(function (x) { return x.key === k; }); }
  function frameOf(parts) { for (var i = 0; i < parts.length; i++) if (parts[i].key.indexOf('frame') === 0) return parts[i]; return null; }
  function designStats(parts, orbit) {
    var frame = frameOf(parts), cap = frame ? card(frame.cardId).rules.capacity : 0, cellSlots = frame ? card(frame.cardId).rules.cellSlots : 0;
    var vol = 0, made = 0, used = 0, cost = 0, cells = 0;
    parts.forEach(function (x) {
      var r = card(x.cardId).rules;
      vol += r.volume || 0; cost += x.paid != null ? x.paid : r.price; if (x.key === 'cells') cells++;
      if (r.power > 0) made += (x.key === 'cells' || x.key === 'panels') ? solarOutput(r.power, orbit) : r.power;
      else used += -r.power;
    });
    return { capacity: cap, volume: Math.round(vol * 10) / 10, made: made, used: used, cost: cost, frame: frame, cells: cells, cellSlots: cellSlots };
  }
  function attitude(parts, orbit) {
    return hasKey(parts, 'wheels') || (hasKey(parts, 'magnetorquers') && (orbit === 'leo' || orbit === 'sso'));
  }
  function riskOf(parts, orbit, thermal) {
    var o = orbitCard(orbit), r = o ? o.rules.risk : 1, why = [];
    why.push({ label: (o ? o.title : 'Orbit') + ' base risk', v: r });
    if (!hasKey(parts, 'battery')) { r += 1; why.push({ label: 'No battery', v: 1 }); }
    if (!attitude(parts, orbit)) { r += 1; why.push({ label: 'No attitude control', v: 1 }); }
    if (hasKey(parts, 'shielding')) { r -= 1; why.push({ label: 'Radiation shielding', v: -1 }); }
    if (hasKey(parts, 'computer')) { r -= 1; why.push({ label: 'Redundant computer', v: -1 }); }
    if (thermal && !hasKey(parts, 'shielding')) { r += 1; why.push({ label: 'Thermal Stress event', v: 1 }); }
    r = Math.max(1, r);
    return { risk: r, chance: (10 - r) / 10, why: why };
  }
  function bestAntenna(parts, opts) {
    opts = opts || {};
    if (hasKey(parts, 'hga')) return 'hga';
    if (opts.signalFade) return null;
    if (hasKey(parts, 'sband') && !opts.sbandDown) return 'sband';
    if (hasKey(parts, 'uhf')) return 'uhf';
    return null;
  }
  function review(parts, missionId, orbit) {
    var m = missionId ? card(missionId) : null, o = orbit ? orbitCard(orbit) : null;
    var st = designStats(parts, orbit), items = [];
    items.push({ ok: !!m, text: m ? 'Mission: ' + m.title : 'Choose a mission' });
    items.push({ ok: !!o && !!m && m.rules.orbits.indexOf(orbit) >= 0, text: o ? 'Orbit: ' + o.title : 'Choose an orbit' });
    items.push({ ok: !!st.frame, text: st.frame ? 'Frame: ' + card(st.frame.cardId).title : 'Buy a frame' });
    items.push({ ok: !!st.frame && st.volume <= st.capacity, text: 'Volume ' + st.volume + ' / ' + st.capacity + ' U' });
    if (st.cells) items.push({ ok: st.cells <= st.cellSlots, text: 'Body-mounted cells ' + st.cells + ' / ' + st.cellSlots + ' (frame surface)' });
    items.push({ ok: st.made >= st.used && (st.used > 0 || st.made > 0 || parts.length > 0), text: 'Power ' + st.made + ' W made, ' + st.used + ' W used' });
    if (m) { var pc = partCard(m.rules.payload); items.push({ ok: hasKey(parts, m.rules.payload), text: 'Instrument: ' + (pc ? pc.title : m.rules.payload) }); }
    var needHga = o && o.rules.requires.indexOf('hga') >= 0;
    var ant = bestAntenna(parts);
    items.push({ ok: needHga ? ant === 'hga' : !!ant, text: needHga ? 'High-gain antenna (required here)' : 'An antenna' });
    if (o && o.rules.requires.indexOf('electric') >= 0) items.push({ ok: hasKey(parts, 'electric'), text: 'Electric thruster (required here)' });
    if (hasKey(parts, 'magnetorquers') && o) items.push({ ok: orbit === 'leo' || orbit === 'sso', text: 'Magnetorquers only work in LEO or SSO' });
    return { ok: items.every(function (i) { return i.ok; }), items: items, stats: st };
  }
  function partPrice(s, key) {
    var c = partCard(key), p = c.rules.price - (s.techDiscount[key] || 0);
    if (key === 'computer' && eventIs(s, 'event-14')) p -= 1;
    return Math.max(0, p);
  }
  function launchPrice(s, orbit, playerIdx) {
    var base = orbitCard(orbit).rules.launch, p = base;
    if (eventIs(s, 'event-05')) p = Math.ceil(p / 2);
    if (eventIs(s, 'event-09') && (orbit === 'leo' || orbit === 'sso')) p += 1;
    if (eventIs(s, 'event-19')) p -= 1;
    p = Math.max(0, p);
    var others = (s.launches[orbit] || []).filter(function (i) { return i !== playerIdx; });
    return { price: others.length ? Math.ceil(p / 2) : p, full: p, rideshareWith: others.length ? others[0] : null };
  }
  function dataPerRound(parts, orbit, s) {
    var n = hasKey(parts, 'wheels') ? 2 : 1, notes = [];
    if (s && eventIs(s, 'event-15') && !attitude(parts, orbit)) return { n: 0, notes: ['Pointing Drift: no wheels or magnetorquers'] };
    if (s && eventIs(s, 'event-10') && hasKey(parts, 'panels')) { n += 1; notes.push('Array Calibration +1'); }
    if (s && eventIs(s, 'event-11') && !hasKey(parts, 'battery')) { n -= 1; notes.push('Eclipse Passage −1'); }
    if (s && eventIs(s, 'event-18') && hasKey(parts, 'cells') && !hasKey(parts, 'panels')) { n -= 1; notes.push('Panel Degradation −1'); }
    return { n: Math.max(0, n), notes: notes };
  }
  function missionOpen(p) { return p.missions.length; }
  function satForMission(s, mid) { return s.sats.filter(function (x) { return x.missionId === mid && (x.status === 'active' || x.status === 'pending'); })[0] || null; }

  // ---------- actions ----------
  function fail(msg) { return { ok: false, error: msg }; }
  function okr(extra) { var r = { ok: true }; for (var k in extra) r[k] = extra[k]; return r; }
  function spend(s, n) { s.actionsLeft -= n; }

  function act(s, a) {
    var pi = a.player != null ? a.player : current(s), p = s.players[pi];
    // pending choices first
    if (s.pending) {
      var pd = s.pending;
      if (pd.type === 'tech' && a.type === 'techPick') {
        s.techDiscount[a.key] = (s.techDiscount[a.key] || 0) + 1; s.pending = null;
        log(s, 'Tech Breakthrough: ' + partCard(a.key).title + ' now costs 1 BC less for the rest of the game.');
        return okr();
      }
      if (pd.type === 'draft' && a.type === 'keepMission') {
        if (pd.offer.indexOf(a.id) < 0) return fail('That mission is not on offer.');
        p.missions.push(a.id);
        pd.offer.forEach(function (id) { if (id !== a.id) s.missionDeck.push(id); });
        if (!pd.free) spend(s, 1);
        s.pending = null;
        if (!p.build) p.build = { missionId: a.id, orbit: card(a.id).rules.orbits[0], parts: [] };
        log(s, p.name + ' takes the mission ' + card(a.id).title + '.', pi);
        return okr();
      }
      if (pd.type === 'trade' && a.type === 'tradeSwap') {
        var pick = pd.offer[a.pick];
        if (pick == null || s.market[a.slot] === undefined) return fail('Pick one card from the deck and one Market slot.');
        var out = s.market[a.slot]; s.market[a.slot] = pick;
        pd.offer.forEach(function (id, i) { if (i !== a.pick) s.specialDeck.push(id); });
        if (out) s.specialDeck.push(out);
        s.pending = null;
        log(s, p.name + ' runs a Trade Study and swaps ' + card(pick).title + ' into the Market.', pi);
        return okr();
      }
      if (a.type === 'cancelPending' && (pd.type === 'trade')) {
        pd.offer.forEach(function (id) { s.specialDeck.unshift(id); }); s.pending = null; return okr();
      }
      if (pd.type !== 'none') return fail('Finish the current choice first.');
    }
    if (s.phase !== 'turns') return fail('It is not the turn phase.');
    if (pi !== current(s)) return fail('It is not your turn.');

    var b = p.build;
    switch (a.type) {
      case 'takeMission':
        if (s.actionsLeft < 1) return fail('No actions left.');
        if (missionOpen(p) >= MAX_MISSIONS) return fail('You already have 2 missions open.');
        var offer = drawMissions(s, 2);
        if (!offer.length) return fail('The Mission deck is empty.');
        s.pending = { type: 'draft', player: pi, offer: offer, free: false };
        return okr({ offer: offer });

      case 'selectBuild':
        if (b && b.parts.length) return fail('Your satellite already has parts; launch or scrap them first.');
        if (p.missions.indexOf(a.missionId) < 0) return fail('That is not one of your missions.');
        if (satForMission(s, a.missionId)) return fail('That mission already has a satellite in orbit.');
        p.build = { missionId: a.missionId, orbit: card(a.missionId).rules.orbits[0], parts: [] };
        return okr();

      case 'setOrbit':
        if (!b) return fail('Choose a mission first.');
        if (b.parts.length) return fail('The orbit is locked once parts are installed.');
        if (card(b.missionId).rules.orbits.indexOf(a.orbit) < 0) return fail('This mission needs a different orbit.');
        b.orbit = a.orbit; return okr();

      case 'buy':
      case 'specialOrder':
        if (s.actionsLeft < 1) return fail('No actions left.');
        if (!b) return fail('Choose a mission to build for first.');
        var key, cid, price, slot = null;
        if (a.type === 'buy' && a.source === 'market') {
          slot = a.slot; cid = s.market[slot]; if (!cid) return fail('That Market slot is empty.');
          key = card(cid).rules.key; price = partPrice(s, key);
        } else if (a.type === 'buy') {
          key = a.key; if (!SHELF[key]) return fail('That part is not on the Workshop shelf.');
          cid = SHELF[key].id; price = partPrice(s, key);
        } else {
          key = a.key;
          var idx = s.specialDeck.findIndex(function (id) { return card(id).rules.key === key; });
          if (idx < 0) return fail('No ' + partCard(key).title + ' left in the Special deck.');
          cid = s.specialDeck[idx]; price = partPrice(s, key) + SPECIAL_ORDER_FEE;
        }
        var isFrame = key.indexOf('frame') === 0, st = designStats(b.parts, b.orbit);
        if (isFrame && st.frame) return fail('You already have a frame. Scrap it first to change size.');
        if (!isFrame && !st.frame) return fail('Buy a frame first: it sets how much fits.');
        var vol = card(cid).rules.volume || 0;
        if (!isFrame && st.volume + vol > st.capacity + 1e-9) return fail('Not enough room: ' + (st.capacity - st.volume) + ' U free, this needs ' + vol + ' U.');
        if (key === 'cells' && st.cells >= st.cellSlots) return fail('No surface left: this frame fits ' + st.cellSlots + ' body-mounted cell' + (st.cellSlots === 1 ? '' : 's') + '. Use deployable panels for more power.');
        if (p.bc < price) return fail('Not enough budget: costs ' + price + ' BC, you have ' + p.bc + '.');
        p.bc -= price; spend(s, 1);
        if (slot != null) refillSlot(s, slot);
        if (a.type === 'specialOrder') s.specialDeck.splice(s.specialDeck.indexOf(cid), 1);
        b.parts.push({ uid: 'u' + (++s.uidSeq), key: key, cardId: cid, paid: price });
        log(s, p.name + (a.type === 'specialOrder' ? ' special-orders ' : ' buys ') + card(cid).title + ' (' + price + ' BC).', pi);
        return okr({ cardId: cid });

      case 'scrap':
        if (!b) return fail('Nothing to scrap.');
        var i = b.parts.findIndex(function (x) { return x.uid === a.uid; });
        if (i < 0) return fail('Part not found.');
        var gone = b.parts.splice(i, 1)[0];
        if (card(gone.cardId).rules.shelf === 'market') s.specialDeck.push(gone.cardId);
        log(s, p.name + ' scraps ' + card(gone.cardId).title + '.', pi);
        return okr();

      case 'tradeStudy':
        if (s.actionsLeft < 1) return fail('No actions left.');
        var free = eventIs(s, 'event-17') && !p.peerReviewUsed;
        if (!free && p.bc < 1) return fail('A Trade Study costs 1 BC.');
        if (a.mode === 'event') {
          if (!s.eventDeck.length) s.eventDeck = shuffle(s, BY_TYPE.event.map(function (c) { return c.id; }));
          if (free) p.peerReviewUsed = true; else p.bc -= 1;
          spend(s, 1);
          s.peekedEvent = { player: pi, id: s.eventDeck[0] };
          log(s, p.name + ' runs a Trade Study on next round’s conditions.', pi);
          return okr({ eventId: s.eventDeck[0] });
        }
        var top = [];
        while (top.length < 3) { var c3 = drawSpecial(s); if (!c3) break; top.push(c3); }
        if (!top.length) return fail('The Special deck is empty.');
        if (free) p.peerReviewUsed = true; else p.bc -= 1;
        spend(s, 1);
        s.pending = { type: 'trade', player: pi, offer: top };
        return okr({ offer: top });

      case 'launch':
        if (s.actionsLeft < 1) return fail('No actions left.');
        if (eventIs(s, 'event-03')) return fail('Launch Delay: nobody can launch this round.');
        if (!b) return fail('Nothing to launch.');
        var rv = review(b.parts, b.missionId, b.orbit);
        if (!rv.ok) return fail('Design Review: ' + rv.items.filter(function (x) { return !x.ok; }).map(function (x) { return x.text; }).join('; '));
        var lp = launchPrice(s, b.orbit, pi);
        if (p.bc < lp.price) return fail('Launch costs ' + lp.price + ' BC; you have ' + p.bc + '.');
        p.bc -= lp.price; spend(s, 1);
        s.rideRefunded = s.rideRefunded || {};
        if (lp.rideshareWith != null && !s.rideRefunded[b.orbit]) {
          var refund = Math.floor(lp.full / 2), q = s.players[lp.rideshareWith];
          q.bc += refund; s.rideRefunded[b.orbit] = true;
          log(s, 'Rideshare! ' + p.name + ' shares a rocket with ' + q.name + ', who gets ' + refund + ' BC back.');
        }
        (s.launches[b.orbit] = s.launches[b.orbit] || []).push(pi);
        var sat = {
          id: 's' + (++s.satSeq), owner: pi, missionId: b.missionId, orbit: b.orbit, parts: b.parts.slice(),
          launchRound: s.round, stored: 0, down: 0, opsRounds: 0, status: 'pending', launchCost: lp.price,
          buildCost: rv.stats.cost, history: []
        };
        s.sats.push(sat); p.build = null; p.stats.launched++;
        // auto-select next build for another open mission
        var next = p.missions.filter(function (m) { return !satForMission(s, m); })[0];
        if (next) p.build = { missionId: next, orbit: card(next).rules.orbits[0], parts: [] };
        log(s, p.name + ' launches ' + card(sat.missionId).title + ' to ' + orbitCard(sat.orbit).title + ' (' + lp.price + ' BC).', pi);
        return okr({ sat: sat.id });

      case 'endTurn':
        s.pending = null; s.turnPos += 1;
        if (s.turnPos >= s.order.length) { s.phase = 'ops'; return okr({ ops: true }); }
        startTurnFor(s);
        return okr();
    }
    return fail('Unknown action.');
  }

  // ---------- operations ----------
  function runOps(s) {
    var rep = [];
    var flareOrbits = { lunar: 1, l2: 1, geo: 1 };
    s.sats.forEach(function (sat) {
      if (sat.status !== 'active' && sat.status !== 'pending') return;
      var p = s.players[sat.owner], m = card(sat.missionId), line = { sat: sat.id, owner: sat.owner, mission: m.title, orbit: sat.orbit, notes: [] };
      if (sat.status === 'pending') {
        var rk = riskOf(sat.parts, sat.orbit, eventIs(s, 'event-13'));
        var roll = d10(s);
        line.launch = { roll: roll, risk: rk.risk, ok: roll > rk.risk };
        sat.riskAtLaunch = rk.risk;
        if (roll <= rk.risk) {
          sat.status = 'lost'; p.stats.lost++;
          line.notes.push('Launch check: rolled ' + roll + ' against Risk ' + rk.risk + '. Satellite lost.');
          retire(s, sat); rep.push(line); queueDebrief(s, sat, 'lost'); return;
        }
        sat.status = 'active';
        line.notes.push('Launch check: rolled ' + roll + ' against Risk ' + rk.risk + '. Working.');
      }
      sat.opsRounds += 1;
      var skip = false;
      if (eventIs(s, 'event-01') && flareOrbits[sat.orbit] && !hasKey(sat.parts, 'shielding')) {
        var fr = d10(s);
        if (fr <= 3) { skip = true; line.notes.push('Solar Flare: rolled ' + fr + ', loses this round of operations.'); }
        else line.notes.push('Solar Flare: rolled ' + fr + ', unharmed.');
      }
      if (eventIs(s, 'event-02') && sat.orbit === 'leo' && !hasKey(sat.parts, 'coldgas') && !hasKey(sat.parts, 'electric')) {
        skip = true; line.notes.push('Space Debris Warning: no thruster to dodge, operations skipped.');
      }
      if (!skip) {
        var dp = dataPerRound(sat.parts, sat.orbit, s);
        sat.stored += dp.n; line.collected = dp.n;
        line.notes.push('Collected ' + dp.n + ' Data' + (dp.notes.length ? ' (' + dp.notes.join(', ') + ')' : '') + '.');
        // downlink
        var comms = orbitCard(sat.orbit).rules.comms;
        var ant = bestAntenna(sat.parts, { signalFade: eventIs(s, 'event-12'), sbandDown: eventIs(s, 'event-16') });
        var scheduled = true;
        if (comms === 'slow' && ant !== 'hga') scheduled = sat.opsRounds % 2 === 0;
        if (comms === 'veryslow') scheduled = sat.opsRounds % 2 === 0;
        var bonusPass = eventIs(s, 'event-08') || eventIs(s, 'event-20');
        if (!ant) {
          line.notes.push(eventIs(s, 'event-12') ? 'Signal Fade: only high-gain antennas get through. Data kept.' : 'Antenna Maintenance: no working antenna this round. Data kept.');
        } else if (!scheduled && !bonusPass) {
          line.notes.push('No ground pass this round (slow comms). ' + sat.stored + ' Data stored.');
        } else if (sat.stored > 0) {
          var send = ant === 'uhf' ? Math.min(UHF_CAP, sat.stored) : sat.stored;
          sat.stored -= send; sat.down += send; line.sent = send;
          line.notes.push((scheduled ? 'Downlinked ' : 'Extra ground pass: downlinked ') + send + ' Data' + (ant === 'uhf' && send === UHF_CAP && sat.stored ? ' (UHF limit)' : '') + '.');
        }
      }
      sat.history.push({ round: s.round, stored: sat.stored, down: sat.down });
      if (sat.down >= m.rules.data) {
        sat.status = 'done'; p.sp += m.rules.sp; p.stats.completed++;
        p.missions.splice(p.missions.indexOf(sat.missionId), 1);
        line.scored = m.rules.sp;
        line.notes.push('Mission complete: +' + m.rules.sp + ' SP.');
        retire(s, sat); queueDebrief(s, sat, 'done');
      } else {
        var life = orbitCard(sat.orbit).rules.lifetime;
        if (life && sat.opsRounds >= life) {
          sat.status = 'reentered'; line.notes.push('Atmospheric drag: the satellite re-enters before finishing. Mission stays open.');
          retire(s, sat); queueDebrief(s, sat, 'reentered');
        }
      }
      rep.push(line);
    });
    s.reportsThisRound = rep; s.reports.push({ round: s.round, lines: rep });
    var top = Math.max.apply(null, s.players.map(function (p) { return p.sp; }));
    if (top >= s.winSP || s.round >= ROUNDS) { s.phase = 'over'; s.winner = winnerOf(s); log(s, 'Game over. ' + s.players[s.winner].name + ' wins.'); }
    else s.phase = 'roundEnd';
    return rep;
  }
  // Special parts go back to the bottom of the Special deck (only 2 of each camera exist; a discard pile locked them away).
  function retire(s, sat) {
    sat.parts.forEach(function (x) { if (card(x.cardId).rules.shelf === 'market') s.specialDeck.push(x.cardId); });
  }
  function winnerOf(s) {
    var best = 0;
    s.players.forEach(function (p, i) { var b = s.players[best]; if (p.sp > b.sp || (p.sp === b.sp && p.bc > b.bc)) best = i; });
    return best;
  }
  function endRound(s) { s.lead = (s.lead + 1) % s.players.length; s.event = null; }

  // ---------- debrief: trade space alternatives ----------
  function queueDebrief(s, sat, outcome) {
    s.debriefs.push({ sat: sat.id, owner: sat.owner, outcome: outcome, round: s.round, alts: alternatives(s, sat) });
  }
  function roundsToFinish(parts, orbit, need) {
    var per = hasKey(parts, 'wheels') ? 2 : 1, comms = orbitCard(orbit).rules.comms, ant = bestAntenna(parts);
    var stored = 0, down = 0;
    for (var r = 1; r <= 8; r++) {
      stored += per;
      var sched = !(comms === 'veryslow' || (comms === 'slow' && ant !== 'hga')) || r % 2 === 0;
      if (sched) { var send = ant === 'uhf' ? Math.min(UHF_CAP, stored) : stored; stored -= send; down += send; }
      if (down >= need) return r;
    }
    return 9;
  }
  function designSummary(label, parts, orbit, mission, note) {
    var st = designStats(parts.map(function (k) { return typeof k === 'string' ? { key: k, cardId: partCard(k).id } : k; }), orbit);
    var keyed = parts.map(function (k) { return typeof k === 'string' ? { key: k, cardId: partCard(k).id } : k; });
    var rk = riskOf(keyed, orbit, false);
    var life = orbitCard(orbit).rules.lifetime;
    var rounds = roundsToFinish(keyed, orbit, mission.rules.data);
    var cost = keyed.reduce(function (a, x) { return a + (x.paid != null ? x.paid : card(x.cardId).rules.price); }, 0) + orbitCard(orbit).rules.launch;
    return { label: label, cost: cost, chance: rk.chance, risk: rk.risk, rounds: rounds, finishes: !life || rounds <= life, parts: keyed.map(function (x) { return x.key; }), note: note, volume: st.volume, capacity: st.capacity, power: st.made - st.used };
  }
  function fitFrame(keys) {
    var vol = keys.reduce(function (a, k) { return a + (k.indexOf('frame') === 0 ? 0 : (partCard(k).rules.volume || 0)); }, 0);
    var f = vol <= 1 ? 'frame1' : vol <= 3 ? 'frame3' : vol <= 6 ? 'frame6' : 'frame12';
    return keys.filter(function (k) { return k.indexOf('frame') !== 0; }).concat([f]);
  }
  function balancePower(keys, orbit) {
    var guard = 0;
    while (guard++ < 6) {
      var st = designStats(keys.map(function (k) { return { key: k, cardId: partCard(k).id }; }), orbit);
      if (st.made >= st.used) break;
      var slots = partCard(fitFrame(keys.slice()).filter(function (k) { return k.indexOf('frame') === 0; })[0]).rules.cellSlots;
      var nCells = keys.filter(function (k) { return k === 'cells'; }).length;
      keys.push(hasKey(keys.map(function (k) { return { key: k }; }), 'panels') || st.used - st.made > 3 || nCells >= slots ? 'panels' : 'cells');
    }
    return fitFrame(keys);
  }
  function alternatives(s, sat) {
    var m = card(sat.missionId), yours = designSummary('Your design', sat.parts, sat.orbit, m, null);
    yours.cost = sat.buildCost + sat.launchCost;
    var base = sat.parts.map(function (x) { return x.key; });
    var lean = base.filter(function (k) { return ['battery', 'shielding', 'computer', 'coldgas'].indexOf(k) < 0 && k !== 'wheels'; });
    if ((sat.orbit === 'leo' || sat.orbit === 'sso') && !hasKey(lean.map(function (k) { return { key: k }; }), 'magnetorquers')) lean.push('magnetorquers');
    if (hasKey(lean.map(function (k) { return { key: k }; }), 'sband') || hasKey(lean.map(function (k) { return { key: k }; }), 'hga')) {
      if (orbitCard(sat.orbit).rules.requires.indexOf('hga') < 0 && sat.orbit !== 'lunar') lean = lean.filter(function (k) { return k !== 'sband' && k !== 'hga'; }).concat(['uhf']);
    }
    lean = balancePower(lean, sat.orbit);
    var safe = base.slice();
    ['battery', 'shielding', 'computer', 'wheels'].forEach(function (k) { if (safe.indexOf(k) < 0) safe.push(k); });
    safe = balancePower(safe, sat.orbit);
    var alts = [yours,
      designSummary('Cheaper option', lean, sat.orbit, m, 'Drops the backups and fine pointing. Cheaper, but more can go wrong and data comes in slower.'),
      designSummary('Safer option', safe, sat.orbit, m, 'Adds a battery, shielding, a backup computer and reaction wheels. Almost always works, but eats budget for the next mission.')];
    return alts;
  }

  var ORBIT_LESSONS = {
    leo: 'LEO is the cheapest ride with fast comms, but drag pulls the satellite down within 3 rounds. Engineers pick fast data collection (reaction wheels) and simple, cheap parts.',
    sso: 'A sun-synchronous orbit passes over each place at the same local time, so lighting is consistent for Earth images, and the panels see plenty of sun.',
    geo: 'Geostationary satellites hover over one spot, which is ideal for watching weather, but the launch is costly and the radiation environment is harsher. Shielding earns its place here.',
    lunar: 'At the Moon, distance makes communication the bottleneck. A high-gain antenna doubles how often you can send data home; without propulsion you can’t get there at all.',
    l2: 'Sun–Earth L2 is about 1.5 million km away: stable, always sunlit and great for telescopes, but only a high-gain antenna can reach home.',
    mars: 'Mars missions wait for launch windows that open about every 26 months. Sunlight is weaker, so panels give less power, and every byte home takes a long time.'
  };

  var api = {
    ACTIONS_PER_TURN: ACTIONS_PER_TURN, WIN_SP: WIN_SP, ROUNDS: ROUNDS, MAX_MISSIONS: MAX_MISSIONS, SPECIAL_ORDER_FEE: SPECIAL_ORDER_FEE, UHF_CAP: UHF_CAP,
    ORBIT_ORDER: ORBIT_ORDER, ORBIT_LESSONS: ORBIT_LESSONS,
    loadCards: loadCards, createGame: createGame, startRound: startRound, beginTurns: beginTurns, act: act, runOps: runOps, endRound: endRound,
    current: current, card: card, orbitCard: orbitCard, partCard: partCard, shelfKeys: shelfKeys, byType: function (t) { return BY_TYPE[t] || []; },
    designStats: designStats, riskOf: riskOf, review: review, partPrice: partPrice, launchPrice: launchPrice, dataPerRound: dataPerRound,
    solarOutput: solarOutput, satForMission: satForMission, bestAntenna: bestAntenna, roundsToFinish: roundsToFinish, d10: d10, rand: rand
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LW = api;
})(this);
