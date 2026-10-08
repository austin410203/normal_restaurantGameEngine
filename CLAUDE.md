# Restaurant Game Engine — guide for Claude

Template for isometric 3D **time-management / restaurant sim** web games.
The repo ships a complete working sample game (*Drive-Thru Dash*, 8 levels). New games are
made by **editing data + a few scene files**, not by rewriting the engine.

**Read this file first. Only open the files the task needs (see the map below) — don't scan
the whole repo.** Users of this template care about token cost.

## Stack & commands
React 18 + TypeScript + Vite 5 · three 0.169 + @react-three/fiber 8 + drei 9 · Zustand 4 · Vitest.
Blender 5.x Python (`pip install bpy`) for 3D assets; `@gltf-transform/cli` for compression.

```
npm run dev          # local dev
npm test             # rule tests (src/game/__tests__)
npm run build        # typecheck + build → dist/ (Vercel: vercel.json already set)
npm run models       # Blender → .assets-raw/*.glb → meshopt → public/models/*.glb
npm run build:single # one-bundle build with models inlined → dist-single/ (claude.ai artifact)
```
Always run `npx tsc --noEmit && npm test && npm run build` before committing.

## Architecture (3 layers, one direction)
```
game/ (pure TS rules, no React/three)  →  store/useGame.ts (Zustand: screens, settings, save)
        ↑ engine instance                         ↓
scene/ (R3F reads engine state every frame)   ui/ (React HUD reads engine on `tick`)
```
- `GameEngine` (src/game/systems/engine.ts) owns ALL gameplay state and rules. It is a plain
  class: `update(dt, inputVec)`, `interact()`, `result()`. Deterministic with a seed → testable.
- Scene components read `engine.*` inside `useFrame` (positions/animation) — never copy state into React.
- UI re-renders on `useGame(s => s.tick)`, bumped ~10 Hz by `Loop` in GameCanvas.
- Engine emits `engine.fx[]` (sound / floating text) and `engine.banners[]` (event toasts, i18n keys).

## File map (what to touch for what)
| Area | File | Notes |
|---|---|---|
| Types / data model | `src/game/types.ts` | ItemId, MenuId, StationKind, Order, Vehicle, LevelConfig, Goal, Upgrade |
| Recipes & cooking | `src/game/data/recipes.ts` | `COOK_RULES` (station→raw→out/burnt/time), `ASSEMBLY`, `MENU_PRICE`, `ITEM_ICON` (emoji used in HUD) |
| Kitchen layouts | `src/game/data/layouts.ts` | station positions (1 unit = 1 tile), walkable bounds, lane Z, pickup window X |
| Levels / upgrades | `src/game/data/levels.ts` | lanes, menu, spawn interval, patience, vip/rush chance, events, goals (stars), unlocks |
| Rules engine | `src/game/systems/engine.ts` | spawning, queueing, orders, scoring, stars, events (rain/jam/rush/breakdown), interact() switch per station kind |
| Tests | `src/game/__tests__/engine.test.ts` | add a test for every new rule |
| Store / save | `src/store/useGame.ts` | localStorage key `restaurant-game-v1` — **rename per game** |
| i18n (zh/en) | `src/ui/i18n.ts` | every UI string + item/station/level names; `useT()` |
| Menus | `src/ui/Screens.tsx` | main menu (quick level grid), level map, result screen, Toggles |
| HUD | `src/ui/GameScreen.tsx` | desktop HUD + **compact phone HUD** (`useCompact`), pause menu, debug panel (`` ` ``), touch controls |
| Input | `src/ui/input.ts` | WASD/arrows/gamepad/joystick → world vector (camera-relative) |
| Styles | `src/styles.css` | CSS tokens in `:root` + `[data-theme=night]`; `.compact` section for phones |
| Canvas / camera / lights | `src/scene/GameCanvas.tsx` | ortho camera framing (desktop vs phone portrait/landscape), day/night lights, Suspense |
| City & ring road | `src/scene/City.tsx`, `src/scene/road.ts` | rounded-rect one-way ring road, townhouses, props; `laneToWorld()` maps engine lane-x → curved world path |
| Restaurant shell | `src/scene/World.tsx` | floor, walls, windows, signs, lane slabs, decorations, rain |
| Stations / player / cars | `Stations.tsx`, `Player.tsx`, `Vehicles.tsx`, `Traffic.tsx`, `CarModel.tsx`, `ItemMesh.tsx` | all render GLB models via `scene/models.tsx` |
| Model loading | `src/scene/models.tsx`, `modelSource.ts` | `Model`, `useModel`, `useCharacter` (adds joint pivots), `ALL_MODELS` preload list |
| 3D assets | `tools/blender/*.py` | `lib.py` primitives (box/cyl/ball/capsule/text + bevel/subdiv), one module per category, `build.py` catalog |

## Recipes for common changes
**New restaurant theme (e.g. ramen shop, bubble-tea stand, pizza)**
1. `types.ts`: replace ItemId / MenuId unions.
2. `recipes.ts`: COOK_RULES / ASSEMBLY / MENU_PRICE / ITEM_ICON.
3. `layouts.ts`: station list (`kind` + `supply` for storage). Reuse kinds: storage, grill, fryer, drink, assembly, counter, pickup, trash.
4. `levels.ts`: 8 LevelConfig entries + UPGRADES.
5. `i18n.ts`: title, level names/descriptions, item names, tutorial lines.
6. Blender: add models in `tools/blender/food.py` (+ `stations.py`), register names in `build.py` CATALOG and `models.tsx` ALL_MODELS, run `npm run models`.
7. Update tests, rename save key, then build.

**New station kind**: add to `StationKind`, handle it in `engine.interact()` switch and `updateStations()`,
add a Blender model `st_<kind>`, add `st_<kind>` i18n key.

**New level event**: add to `EventType`, handle in `updateEvents()` (warn 5 s before via `banner('event.X.warn')`),
add i18n keys `event.X.warn/start`.

**Dine-in instead of drive-thru**: keep engine queue logic but replace `laneToWorld()` (road.ts) with a path to tables,
and `Vehicles.tsx` with seated customers (`char_*` models). Engine only knows 1-D lane positions.

## Invariants / gotchas
- Coordinates: x/z ground plane, 1 unit = 1 tile, kitchen floor raised 0.14 (Stations/Player are wrapped in a y=0.14 group). Station work-surface height `TOP = 0.9`.
- Blender: Z-up, model front = **-Y** (becomes +Z in three). Vehicles are modelled facing **+X**.
- Characters must keep separate nodes `legL legR body armL armR head`; `useCharacter()` re-pivots them at JOINTS (hip 0.42, shoulder 0.8, neck 0.88). Characters are only meshopt-compressed (not `optimize`), other assets are fully optimized.
- Blender cannot re-import meshopt files: the asset board render (`build.py --sheet-only out.png`) reads `.assets-raw/`.
- claude.ai artifacts can't serve `.glb` → use `npm run build:single` (models inlined via `src/scene/modelData.gen.ts`, gitignored).
- Don't allocate THREE objects inside `useFrame`; geometries/materials are cached (`kit.ts rbox()`, `ItemMesh.mat()`).
- Hooks before early returns (React rules) — the HUD components early-return often.
- Phones: `useCompact()` switches HUD; camera framing in `CameraRig`; respect `env(safe-area-inset-*)`; `index.html` has `viewport-fit=cover`.
- Theme day/night = `useGame().theme` (also sets `data-theme` on <html>); language = `useGame().lang`. Every new UI string goes through `t()`.
