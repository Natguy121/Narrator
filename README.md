# THE NARRATOR SAYS · 旁白说

A first-person 3D browser game in **one self-contained HTML file** that runs offline.

You are a regular person walking through a busy Chinese neighborhood. A calm, smug Narrator speaks in your head and tells you exactly what to do, one order at a time. Obey and things go smoothly. Disobey and the Narrator reacts, and the city gets funnier and stranger.

**Play online:** https://natguy121.github.io/Narrator/

**Play offline:** open [`the-narrator-says.html`](the-narrator-says.html) in a modern desktop or mobile browser. No server, no internet, no install.

## How it plays

- **~30 live commands** in one continuous walk: walk forward, stop, *pet the cat (no, don't pet the cat)*, say good morning to Grandpa Wang, cross the street (*now… not yet… now*), find Old Wang's noodle shop, sit by the window, order the second cheapest thing, add chili oil (*it's mild, I promise*), wait in line, skip the line, turn left at the red lantern, bow to the tea master, opposite day, tie a wish ribbon at the temple, stand still for the pigeons, buy oranges at the wet market, ride the metro, join the tai chi, run to the night market, buy one dumpling, look up… and go home.
- **Rules** (up to 3, top right) change per place and can contradict the commands: *Never stop moving*, *Don't look up*, *Only walk on the left*, *Don't talk to anyone*, *Walk slowly in the hutong*, *Hold your breath in the metro*, *Do the opposite of what I say*, *Never walk backwards*…
- **Lies:** some orders are lies and he swears they're safe. Some disobedience opens a secret, and he pretends he planned it.
- **Consequences** are harmless and silly: every NPC turns to stare, the street rearranges itself, gravity goes floaty, the lights flicker while he panics, a dumpling auntie chases you, a personal rain cloud, giant heads, black-and-white, a tilted world, a scooter intervention, a pigeon explosion.
- **The Narrator** speaks through browser speech synthesis (with subtitles), never repeats a line twice in a row, and has an arc: calm and professional → annoyed → pleading → unraveling → a soft ending. The world shifts from morning to night as you go.
- **Guidance:** ignore him for a few seconds and a glowing trail shows the way; he gets more impatient the longer you take.
- **Endings:** obedient, rebel, in-between, and a hidden one. (Try talking back with **Q**.)

## Controls

| Desktop | Action |
|---|---|
| WASD / arrows + mouse | Walk and look (click to capture the mouse) |
| Shift / C | Run / walk slowly |
| Space | Jump |
| E | Use, pick up, sit, pay |
| F / G | Say hello / bow |
| H (hold) | Hold your breath |
| Q | Talk back to the Narrator |
| Esc / P | Pause, restart from the last command |

On touch devices: left thumb drags to walk (gently = slowly), right thumb drags to look, plus on-screen buttons.

## Building from source

The game is written as plain JavaScript in `src/js/` (concatenated in order) with an HTML/CSS shell in `src/template.html`. The build bundles three.js (r170) into the page so the result has no external dependencies.

```bash
npm install
npm run build   # writes the-narrator-says.html
```

Everything (city, people, textures, signage, music and sound effects) is generated procedurally at load time; there are no asset files.
