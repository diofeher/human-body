# Squat Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An "Agachamento" screen in the atlas that plays a bodyweight squat with the skeleton and six muscle groups.

**Architecture:** One data file drives both sides. A Blender script poses and deforms the right side and midline pieces, and writes a GLB whose muscles carry one morph target per stored depth, plus per-depth bone segment matrices. The browser maps time to depth, interpolates, and mirrors the right side to draw the left.

**Tech Stack:** Blender 5.3 Python, gltf-transform meshopt, TypeScript, Three.js, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-26-squat-animation-design.md`

## Global Constraints
- Branch `feat/squat-animation`. Never push or merge to `main` (it deploys).
- Visible text in pt-BR. Page shows "não revisado" and keeps the educational notice.
- Download (GLB + manifest) at most 4 MB; at least 30 fps on a mid-range phone.
- Phases Início, Descida, Fundo, Subida. Starts paused. Speeds 0,5× and 1×.
- Angles: 0° standing, measured as flexion; the screen says so.
- Wording describes typical roles, never activation. No unsupported injury claims.
- Vertex penetration target: no vertex more than 3 mm deeper than at rest. Jump target: no muscle's largest jump more than twice its value without the push-out.
- Blender runs with `--factory-startup --disable-autoexec`.
- Do not touch `.claude/`.

## Deviation from the spec (symmetry)
The asset holds the right side and midline pieces; the player mirrors the right side in x. The movement is symmetrical and the source's sides are mirrored copies. This also removes the dependence on `Iliocostalis colli muscle` (no suffix). Eretores are rigid with the one-block trunk, so they need no deformation or push-out.

## Review Focus
1. Leaving the exercise while it is still loading, or opening it twice: one load, no duplicate canvas or running loop.
2. A failed download: error with a retry that works.
3. Background tab: a long frame gap must not skip through the movement.
4. Seeking while playing or paused keeps that state; times outside the cycle wrap.
5. Phone width: the 3D view stays visible while cards scroll; dragging on it rotates and does not trap page scroll over the cards.

Lines 3 and 4 are unit tests in Task 1; 1, 2 and 5 are browser checks in Task 4.

---

### Task 1: Exercise data and timeline
**Files:** Create `src/exercises/squat.json`, `src/exercises/types.ts`, `src/exercises/timeline.ts`; Test `tests/timeline.test.ts`

**Interfaces — produces:**
- `squat.json`: `{ id, name, reviewed:false, depths:11, maxAngles:{shank:30,thigh:82,trunk:35,arm:90}, phases:[{id:'inicio'|'descida'|'fundo'|'subida', label, seconds, from, to, cues:string[]}], mistakes:[{title,text}], groups:[{id,label,role:'principal'|'apoio',note,pieces:[{name,kind}]}] }`; seconds 1, 2.5, 1, 2; depth from/to 0→0, 0→1, 1→1, 1→0. `kind`: `hipFemur` (pelvis→thigh), `vasti`, `rectus`, `hamstring` (pelvis→thigh→shank), `bicepsShort` (thigh→shank), `gastroc` (thigh→shank→foot), `soleus` (shank→foot), `trunk` (rigid). `name` is `sourceName` without side suffix.
- `duration(ex): number`; `wrapTime(ex, t): number`; `phaseAt(ex, t): {index, phase, local}`; `phaseStart(ex, index): number`; `depthAt(ex, t): number` (cosine ease inside a phase); `anglesAt(ex, depth): {knee, hip, ankle}` rounded integers (knee = shank+thigh, hip = trunk+thigh, ankle = shank, times depth); `blend(depth, count): {a, b, mix}`; `advance(ex, t, dtSeconds, speed): number` with dt capped at 0.1.

- [ ] Step 1: tests. `duration`=6.5; `phaseAt(0).phase.id`='inicio', `phaseAt(1).phase.id`='descida', `phaseAt(6.5).index`=0, `phaseAt(-0.1).phase.id`='subida'; `depthAt` is 0 at 0.5, 0.5 at 2.25, 1 at 4, 0.5 at 5.5; `anglesAt(1)`={knee:112,hip:117,ankle:30}, `anglesAt(0)` all 0; `blend(0,11)`={a:0,b:1,mix:0}, `blend(1,11)`={a:9,b:10,mix:1}, `blend(0.55,11)` a=5,b=6,mix≈0.5; `advance(0,30,1)`=0.1; `advance(6.45,0.1,1)`≈0.05. Also: every group has a role, there are 6 groups and 22 pieces.
- [ ] Step 2: `npx vitest run tests/timeline.test.ts` fails. Step 3: implement. Step 4: passes. Step 5: commit `feat: add squat data and timeline`.

### Task 2: Blender export (delivery check first)
**Files:** Create `tools/convert/exercise.py`, `tools/convert/build-exercise.sh`, `public/exercises/squat.glb`, `public/exercises/squat.json`; Test `tests/exercise-asset.test.ts`; Modify `tools/convert/SOURCE.md`

**Interfaces — consumes:** `src/exercises/squat.json`, `public/data/structures.json`.
**Produces:** GLB nodes: `bone-<segment>` (merged mesh per segment, right side), `bone-midline` (merged, rides on trunk), `muscle-<slug>` with `depths-1` morph targets named by index (`trunk` kind: no targets). Manifest: `{ depths, segments:{foot|shank|patella|thigh|trunk|arm: number[depths][16]}` column-major, Y-up, `, muscles:[{node, group, name, segment: 'trunk'|null}], pivots:{hip,knee,ankle}: number[depths][3], report:[{name, maxPenetrationMm, maxJumpMm, maxJumpNoPushMm}] }`.

Method: the spec's five steps, ported from `.superpowers/spike/jitter2.py` (80 solve steps, Gaussian time smoothing sigma 3.5 steps, radius 8, sample every 8th step for 11 depths). Joints (atlas coords, z up): hip (-0.083,0.004,0.861), knee (-0.081,0.016,0.455), ankle (-0.076,0.042,0.072), shoulder (-0.165,0.022,1.39). Absolute rotations about x at depth d: shank +30d about ankle, thigh -82d about knee, trunk +35d about hip, arm -90d about moved shoulder, patella = thigh ∘ rotation of 0.7×(shank+thigh)d about knee. Radius, ulna and hand follow `arm`. Muscle meshes are decimated (ratio 0.5) at rest, before weighting.

- [ ] Step 1: asset tests: GLB has a node for each of the 22 pieces; non-trunk muscles have 10 targets; manifest has 11 matrices per segment; every report row has `maxPenetrationMm <= 3` and `maxJumpMm <= 2*max(maxJumpNoPushMm, 1)`; GLB + manifest <= 4e6 bytes. Fails.
- [ ] Step 2: write exporter and shell script (meshopt compression); run; print the report.
- [ ] Step 3: tests pass. A target that fails is reported to the user with numbers; thresholds are not loosened.
- [ ] Step 4: render each group at depths 0, 0.5, 1 (`--renders <dir>`) and inspect. Spec checkpoint: a group that cannot be made acceptable stops the work.
- [ ] Step 5: record the Z-Biomechanics joint source in SOURCE.md; commit `feat: export squat animation asset`.

### Task 3: Player
**Files:** Create `src/exercises/player.ts`

**Interfaces — produces:** `createPlayer(container: HTMLElement): Promise<{ setDepth(d:number):void; setSupportVisible(v:boolean):void; setActive(active:boolean):void; stats():{triangles:number} }>`; rejects if either download fails, leaving the container empty. Renders on demand. Mirrored copy: group with `scale.x=-1` sharing geometry and morph influences; midline not mirrored. Normals recomputed or morph normals so lighting follows the bent shape. Angle labels are HTML overlays at the projected right-side pivots, fed by `anglesAt`.

- [ ] Implement, typecheck with `npx tsc --noEmit`, commit with Task 4.

### Task 4: Screen, entry and credits
**Files:** Create `src/exercises/screen.ts`, `src/exercises/exercise.css`; Modify `index.html`, `src/main.ts`, `src/ui/credits.ts`, `LICENSE-ASSETS`, `README.md`; Test `tests/credits.test.ts`

- Header link "Exercícios" → `#agachamento`; hash routing hides the atlas `main` and shows `#exercise` (lazy `import()`), and a "Voltar ao atlas" link returns.
- Layout C per spec; wide screens (>800px) put the view left, cards right. "não revisado" badge, role legend with text labels, "Ocultar músculos de apoio" checkbox, angle convention note, collapsible "Erros comuns", error with retry.
- Leaving the screen pauses and stops the loop.
- [ ] Step 1: failing credits test: `CREDITS_HTML` mentions "animação" and "deformados". Step 2: implement. Step 3: `npm test && npm run build`.
- [ ] Step 4: in Chrome: the spec's verification list plus Review Focus 1, 2, 5; measure frame rate and download.
- [ ] Step 5: commit `feat: add squat exercise screen`.

### Task 5: Final review
- [ ] Review the branch diff with fresh eyes, fix findings, update `TODO.md` status, run `npm test && npm run build`, report numbers and untested items (real phone, professional review).
