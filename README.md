# Leonida Trophy Guide: GTA VI, all 55 trophies

[![Rank](https://make.fun/badge/gta6-trophy-guide-01/jepebrutal030-web/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/jepebrutal030-web/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

A complete offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI, built for the [make.fun gta6-trophy-guide-01 competition](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) ($250 pot, top 50 paid).

## What it is

A static web app under `app/` that opens in desktop Chrome with the network off. It lists every one of the 55 official trophies with its official name, description and grade, and a guide to each in our own words with its sources named beside it. It is a tracker too: tick trophies off, and progress saves in the browser, exports to a file and imports back.

## What it covers

- **All 55 trophies**: 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden on PlayStation until earned. Names, descriptions and grades are as PlayStation publishes them, as listed by Exophase and PSNProfiles.
- **Roadmap to the platinum**: five stages in order. Story first, then side characters, then the map, then the grind, then the platinum.
- **Missable flags**: 23 trophies tied to a specific mission, choice or one-time moment, flagged so you do them when the chance comes.
- **Filters**: by kind (story, missable, collectibles, activities, online), by grade, by earned state, plus full text search.
- **Spoiler mode**: hides the names and descriptions of hidden story trophies until you earn them.
- **Cited guides**: every guide names its sources. No guide text is copied from another guide. The look is our own: no Rockstar logo, no official artwork, no screenshots of the game.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no network. `main.ts` hands the guide in for grading: it copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Tips

- **Deep links**: `#trophy=17` opens one trophy's guide, `#view=roadmap` jumps to the roadmap, `?filter=missable` starts on the missable filter.
- **Demo mode**: open with `?demo` to seed a few earned trophies, so a first look shows the progress bar and the earned styling.
- **Spoiler mode** hides the names and descriptions of the 28 hidden story trophies until you earn them. Your spoiler setting saves with your progress.

## Files

- `app/index.html`, `app/style.css`, `app/app.js`: the guide app.
- `app/data/trophies.json`: the 55 trophies with official data plus our guides, kinds, missable flags, hidden flags and roadmap stages.
- `screenshots/`: 4 renders of the app in a browser (the first is the cover).
- `main.ts`: the entrypoint. `serve.ts`: the local dev server. `vendor/makefun-frontend.ts`: the kit's dossier library, unchanged.
