# Entry: Ember Duel — a card game

make.fun contest. Original 1v1 card game, plain static files under `game/`, desktop browser, keyboard and mouse, no network, no build step. Original art (canvas/CSS only), original names.

## Game spec (build this, improve where it helps)
Lantern-festival duel of moths. Both players start at 12 Embers. You get 3 Wick a turn; cards cost Wick. A turn: play up to 3 cards, then End Turn. The opponent AI reveals its intent (icon + value) at the start of your turn, so you can read and counter it. Resolution: your Lantern attack vs its Moth guard, damage = difference to its Embers, and the same back at you.
Cards have suit, cost and value. Suits: Lantern (attack), Moth (guard), Wind (draw 1, or +1 Wick), Wax (heal 2 Embers, -1 cost). Hand max 5, deck 16, reshuffle when empty. Combos: two Lanterns in one turn Ignite (+2 attack); two Moths in one turn Veil (+2 guard). Win when the rival hits 0 Embers, lose at 0 yourself. Restart from the end screen.

## Required screens and states
Title screen (game name, one-line how to play, Start). Table (opponent hand top, your hand bottom, both Ember totals, Wick meter, opponent intent, End Turn). Win screen and loss screen with restart. Cards must show value and suit by colour and shape, large and readable. Polish: dealt hand, cards sliding/flipping in, a win flourish.

## Hard rules
- `game/index.html` plus ES modules under `game/src/`, standard browser JS, no imports outside `game/`, no network, no libraries (vendor stays untouched).
- `main.ts` at root (Node 22, stdlib only): copies `game/` and `screenshots/` to `/output` (env `MAKEFUN_OUTPUT_DIR` or `/output`) and writes `dossier.json` with `buildDossier` from `./vendor/makefun-game.ts`, with the starter's caps: text_max_bytes 163840, screenshots {max:4,max_bytes:262144}, game_max_files 993, game_max_bytes 50331648, game_path_max_bytes 1000.
- `screenshots/`: 4 images named `1-title.png`, `2-table.png`, `3-win.png`, `4-loss.png`, real headless-Chrome captures of `game/index.html?shot=title|table|win|loss&seed=1` at 1280x720, whole PNG, under 256 KiB each.
- `.makefun/owner.json` holds `{"wallet": "AVs8TMJcjvgmozor7LTDcWntMZpC2gAUmWFPe3AG61bo"}`. LICENSE MIT. README carries three make.fun badges.
- Split the code into files with one clear job each and name functions for what they do.

## Capturing screenshots
Chrome: `~/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome --headless=new --disable-gpu --hide-scrollbars --window-size=1280,720 --virtual-time-budget=4000 --screenshot=<out.png> "file://<abs path>/game/index.html?shot=table&seed=1"`. Check each with `file` and `stat -c%s` (PNG, <=262144). Retake if a frame looks empty: the `?shot=` scenes must render a finished frame immediately (autoplay the rules forward, no input needed).

## How to work
1. Build the game, run `node serve.ts`-style check is optional; do not need it.
2. Capture the four screenshots and inspect that each is non-trivial (size > 20 KiB).
3. Play-test the rules headlessly if useful; fix bugs.
4. Revise the game at least twice after it first runs (edit files, recapture screenshots).
5. `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` must succeed and out/dossier.json must exist.
6. Commit everything and push.
