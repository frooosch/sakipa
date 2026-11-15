# Sakipa Satellite

A card game about building CubeSats: take missions, pick an orbit, fit a satellite inside its budget, volume and power, launch it and earn Science Points from the data it sends home. Every card links to the real science behind it.

## Play

The game is a static web page; it loads `cards.json`, so it needs a local server rather than opening the file directly:

```bash
python3 -m http.server 8123
```

Then open http://localhost:8123.

## Files

- `index.html`: the game screen
- `engine.js`: the rules, with no browser code (also runs in Node)
- `cards.json` and `cards/`: the 106 cards and their art
- `RULES.md`: the full rules, with a changelog
- `ANALYSIS.md`: what was found and fixed after the v2 prototype
- `sim.js`: balance simulator, `node sim.js [games] [players]` (add `SAFE=1` for a cautious bot)
