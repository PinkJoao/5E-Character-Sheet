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
5. Class - class, multiclass, subclass, level and skill proficiencies, with info and art in the preview. Feature progression view (unlocked or full 1-20) and the class table.
6. Class progression - per-level choices: feats / ability score increases, fighting style, expertise, weapon mastery. Feat prerequisites are shown and checked against the character (legacy feats count as general feats, with a free +1 bonus).

**Planned**

The end goal is a sheet you can **play with at the table**: open the app on your phone, tap a skill, save or attack, and roll it — with every bonus already computed from your build. Getting there:

7. Skills - consolidated skill list with sources and bonuses.
8. Equipment - inventory, weapons and armor (feeding AC and attacks).
9. Spellbook - spell selection and prepared spells for casters.
10. Play mode - roll skills, saves, attacks and damage from the sheet; track HP, hit dice and resources during a session.
11. Export - **Foundry VTT** and **PDF**.
12. Wizard - step-by-step guided mode for new players.

Along the way, the remaining features of the previous prototype (dnd-sheet) keep being ported and improved.

## Development

```bash
npm install
npm run dev     # start
npm run test    # run tests
npm run build   # production build
```

## Data

Game content (species, classes, feats, items and so on) comes from the open-source **5e.tools** community project:

- **How it's obtained** - the app downloads the JSON data files at runtime from the community's public mirror, on first launch and whenever the local copy is stale or incomplete.
- **How it's stored** - everything is cached in your browser (IndexedDB), so the app opens instantly and works offline after the first load. Your characters live in the same local database and never leave your device.
- **What's in this repository** - only code. No game content is bundled, committed or redistributed here.

This project is **not affiliated with, endorsed by, or connected to 5e.tools** in any way. Huge thanks to the 5e.tools open-source community for the data files and the structure that make this app possible.
