# 5E-Character-Sheet

A character builder for **D&D 5e (2024 rules)**. Mobile-first, runs in the browser, and keeps your characters saved locally.

## Features

- Manage multiple characters (create, duplicate, import/export).
- Build a character across **Species**, **Background**, **Class** and more — with stats (ability scores, HP, saves, proficiencies) updating live as you choose.
- Rich pickers with search, filters and a detail preview (art, lore and full feature text) for every choice.
- Custom origin (no prepackaged backgrounds) and full **multiclassing**.
- Game content comes from the 5e.tools community and is cached for offline use.

## Roadmap

**Done**
- Character roster and local saving.
- Species - traits, lore and racial choices.
- Background - ability boosts, origin feat, proficiencies and language.
- Class - class, multiclass, subclass, level and class skill proficiencies, with class/subclass info and art in the preview.

**Planned**
- Remaining per-level class choices (ability score increases / feats, fighting styles, expertise, etc.).
- Skills, Equipment and Spellbook.
- Export to **Foundry VTT** and **PDF**.
- A step-by-step wizard for new players.

## Development

```bash
npm install
npm run dev     # start
npm run test    # run tests
npm run build   # production build
```

## Data

Character content is provided by the open-source **5e.tools** community, fetched at runtime and cached in the browser. No content is stored in this repository, and this project is not affiliated with 5e.tools.
