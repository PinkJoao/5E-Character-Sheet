# 5E-Character-Sheet

A robust, **mobile-first** character builder for **D&D 5e (2024 rules)** — create, manage and (eventually) export multiple characters, with live-derived stats and a powerful, reusable selection UI inspired by 5e.tools and Pathbuilder 2e.

This file is both the **documentation** and the **roadmap** for the project.

---

## Goals

1. **Work great on phone _and_ desktop.** Mobile is the primary focus — nothing is a "desktop site that happens to open on mobile" — but the desktop layout matters too.
2. **Manage many characters** and export sheets as **PDF** and as **Foundry-ready JSON** (a sheet that actually works inside Foundry VTT, with attacks, spells, etc.).
3. **Never hand-update game data.** The app fetches 5e.tools data from the community mirror and caches it in the browser.

## House rules baked in

- **2024 rules only**, adapting legacy content (older books) following the new book's principles. Subclass level is standardized; multiclassing is supported.
- **No prepackaged backgrounds.** The player builds a **custom origin** piece by piece: ability boosts, an origin feat, skill/tool proficiencies and a language — all chosen individually.
- **Multiclass works** (e.g. Fighter 1 / Warlock 10).

---

## Core principles

- **Store decisions, not computed state.** The saved character records what the player _chose_ (base scores, feats, picks). Final numbers and the Foundry export are _derived_ on the fly. Easier to fix, easier to export.
- **Rules engine is separate from the UI.** The part that knows D&D math knows nothing about buttons or screens, so it can be unit-tested without rendering anything.
- **One generalized, recursive "Choice" system.** Many features grant choices, and choices can grant _other_ choices (Pathbuilder-style). A single model + renderer handles species traits, origin feats (Skilled/Crafter/Magic Initiate), and — later — class features and eldritch invocations.

---

## Architecture

### Data layer — "The Gatekeeper"
The app does **not** ship the heavy 5e.tools JSON. It fetches from the community mirror and caches in **IndexedDB (Dexie)**:

- **First run:** "Updating Compendiums…", downloads everything, stamps it with today's date.
- **Next runs:** if the cache is **< 30 days** old → opens instantly, zero network.
- **Expired:** tries to refresh; if offline, silently keeps the old data and opens anyway. **The app never bricks for lack of internet** once it has cached.
- **Force update:** ALT+click (or long-press on mobile) the version tag in the footer to re-download, ignoring the 30-day TTL.

> ⚠️ The mirror URL **migrates periodically** (DMCA takedowns). The active base today is `5etools-mirror-3/5etools-src`. It's kept in one swappable config with room for fallback mirrors.

### Rules engine (pure, fully tested)
Takes the character's decisions and derives everything: ability scores & modifiers, proficiency bonus, HP, skills, saves, multiclass rules, and the recursive collection of proficiencies/languages/feats from every choice on the sheet. Validated against real Foundry characters used as ground-truth fixtures.

### Universal selector + detail view
Every selection point (species, feat, tool, language, …) opens **one reusable panel** with search, **tri-state filters** (off / include / exclude), and a rich **detail view** — 5e.tools `entries` rendered (with `{@tag}` markup), plus lore and images from the fluff data. It adapts itself: filters become a drawer on mobile, and tapping a card opens a full detail screen before selecting.

### The Choice system
- **Parser** turns 5e.tools data (`skillProficiencies`, `feats`, the combined `skillToolLanguageProficiencies`, the `any*` tokens, …) into uniform `Choice` descriptors.
- **Recursive renderer** (`ChoiceList`) draws each choice (chips, add-from-panel, feat picker) and, when a chosen feat has its own choices, renders them nested below.
- **Sheet-aware:** you can't pick the same skill/tool/language twice anywhere — unless the feature is `repeatable` (e.g. Skilled). Reprints and non-playable **NPC species** are filtered out (latest, playable versions only).

### Foundry export (planned)
A Foundry sheet is a bundle of dozens of fully-hydrated items. Rather than rebuild that from scratch, the plan is a **hybrid**: reuse already-converted items (Plutonium output) keyed by hash, and hand-build only the special cases (translations / homebrew). Real characters (Talion, Tobias, …) are the verification fixtures.

---

## Tech stack

- **React 19** (React Compiler) + **Vite**
- **Zustand** (state), **Dexie / IndexedDB** (storage), **React Router**
- **CSS Modules**, **Vitest** (unit tests), **ESLint**
- Planned: **@react-pdf/renderer** (PDF export)

---

## Status & roadmap

Legend: ✅ done · 🚧 in progress · ⬜ planned

### Foundation
- ✅ **Phase 0 — Scaffold:** project structure, routing, light/dark theme.
- ✅ **Phase 1 — Data Gatekeeper:** dynamic fetch + IndexedDB cache (30-day TTL, offline fallback, force-update).
- ✅ **Phase 2 — Character storage:** decisions-based schema, Dexie repo, Zustand store, roster (create / duplicate / delete / import / export JSON).
- ✅ **Phase 3 — Rules engine:** pure derivation (scores, mods, prof bonus, HP, skills, saves, multiclass), 5e.tools parsers, recursive choice collection — validated against real Foundry characters.
- ✅ **Phase 4 — Universal selector:** search + tri-state filters, reprint + NPC-species filtering, mobile drawer.

### Phase 5 — The full sheet 🚧
- ✅ **Shell:** portrait, live-derived stats header (Level / HP / Alignment tiles, ability cards with base steppers, single Proficiencies card), tabbed nav.
- ✅ **Species tab:** selection, quick stats, traits + lore + image, and species sub-choices.
- ✅ **Background tab:** custom origin — ability boosts (+2/+1 or +1/+1/+1), origin feat (with recursive sub-choices), and 2 skills / 1 tool / 1 language, all via the Choice system.
- ✅ **Choice system:** recursive sub-choices, `repeatable` feats, cross-sheet de-duplication, combined pools (Skilled), languages (always Common + race-granted), 5e.tools detail/lore/images.
- 🚧 **Class tab:** class, multiclass, subclass and level selection ✅ — live HP / saves / proficiency, with the original-class saving-throw rule and a level-20 cap. Per-level choices (skills · ASI · feat · fighting style · expertise · weapon mastery) ⬜ next.
- ⬜ **Skills tab:** consolidated skill view.
- ⬜ **Equipment tab:** inventory & currency.
- ⬜ **Spellbook tab:** spell selection (known / prepared / pact).

### Beyond
- ⬜ **Phase 6 — Foundry export:** hybrid hash-keyed hydration + verification against ground-truth characters.
- ⬜ **Phase 7 — Beginner wizard:** step-by-step creation sharing state with the full sheet.
- ⬜ **Phase 8 — PDF export & polish:** @react-pdf/renderer, translation/homebrew overrides, accessibility.

### Smaller pending items
- ⬜ Spell choices (`additionalSpells`, e.g. Magic Initiate) and feats with embedded ASI.
- ⬜ Inline race language choice (`anyStandard: N`) and fixed race skill/tool grants.
- ⬜ Portrait upload, HP rolling (Roll / Average), and tap-to-roll checks/saves.
- ⬜ Optional translator (PT-BR) — UI keys are already separated from labels for this.

---

## Development

```bash
npm install
npm run dev      # start the dev server
npm run test     # run the engine/unit tests (Vitest)
npm run lint     # ESLint
npm run build    # production build
```

---

## Data sourcing from the 5e.tools community

This project uses data generously provided by the open-source **5e.tools** community. The data is fetched at runtime and processed to populate the sheet (species, feats, items, spells, …). **No content is hosted in this repository**, and this is not an official 5e.tools product. Huge thanks to the 5e.tools community for their invaluable open-source contributions.
