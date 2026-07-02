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
1. Foundation - data layer (5e.tools content, offline cache), local storage, character roster.
2. Sheet shell - live derived stats (abilities, HP, saves), proficiencies card, tab navigation, portrait upload.
3. Species - traits, lore and racial choices.
4. Background - ability boosts, origin feat, proficiencies and language.
5. Class - class, multiclass, subclass, level and skill proficiencies, with info and art in the preview.
6. Class progression - per-level choices: feats / ability score increases, fighting style, expertise, weapon mastery. Feat prerequisites are shown and checked against the character (legacy feats count as general feats, with a free +1 bonus).

**Planned**
7. Skills - consolidated skill view and rolling.
8. Equipment - inventory and item management.
9. Spellbook - spell selection for casters.
10. Export - **Foundry VTT** and **PDF**.
11. Wizard - step-by-step guided mode for new players.

## Development

```bash
npm install
npm run dev     # start
npm run test    # run tests
npm run build   # production build
```

## Data

Character content is provided by the open-source **5e.tools** community, fetched at runtime and cached in the browser. No content is stored in this repository, and this project is not affiliated with 5e.tools.
