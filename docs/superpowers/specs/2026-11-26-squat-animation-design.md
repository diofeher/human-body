# Bodyweight exercise animations, first version: the squat (design)

Items marked **(my call)** were not discussed. Change any of them during review.

## Intent
Trainers and people practising an exercise use the atlas to understand three things:
which muscles work, how the joints move, and how to do the exercise correctly.
Muscles, skeleton and joints are what matter on screen.

## Goals
- One exercise: the bodyweight squat, with the whole skeleton and six muscle groups on both sides.
- Correct movement only, with short cues for each phase. Common mistakes are described in text.
- A phone-first, step-by-step screen: one card per phase, and tapping a card jumps to that phase.
- The 3D view can be rotated while paused or playing.
- All visible text in Portuguese (pt-BR) **(my call, follows the atlas)**.

## Non-goals
- Other exercises (lunge and push-up come later).
- Animated wrong form. Leave room to add it later: exercise data must allow more than one movement per exercise.
- Organs, vessels, nerves, other soft tissues, skin or a realistic human figure.
- Realistic muscle deformation (bulging, sliding), or measured muscle activation.
- Motion capture or the movements in `Z-Biomechanics.7z`: their origin is not stated in the licence text we read.

## Anti-goals
- Muscles that visibly detach, pass through bone or jump during playback.
- A highlight that reads as measured activation.
- Unreviewed movement or technique text on the public site.

## Constraints
- **A push to `main` deploys the public site.** Work stays on a branch and is not merged until a qualified professional (physiotherapist or physical education professional) has reviewed the movement, the cues, the mistakes and the muscle roles **(my call on how; the review itself is required by `TODO.md`)**.
- Static site: Vite, TypeScript, Three.js. No backend.
- Licensing follows the atlas spec: converted and adapted assets are CC BY-SA 4.0. The credits page must say that we animated and deformed the models. Check the licence of any new material. `Z-Biomechanics` states BodyParts3D, CC BY-SA 2.1 Japan, modified by Z-Anatomy; we use only joint positions read from it. Record this in `tools/convert/SOURCE.md` and the credits, and confirm the wording against that licence.
- The page keeps its "educational, not medical advice" notice.

## Approaches
1. **Atlas muscle meshes that follow the bones, prepared in Blender, played back in the browser (chosen).** Looks like the atlas. Hardest to build; no realistic bulging or sliding.
2. Simplified muscle bands between attachment points. Predictable and light, but looks like a diagram.

Also rejected: simulating muscle deformation (far more work) and pre-rendered video (cannot be rotated).
The user chose 1, saw a throwaway test of it, asked for its flaws to be fixed, and approved the result.

## Muscles
Exact `sourceName` values in `public/data/structures.json`, each with `.r` and `.l`. The `.r` names were checked; confirm every `.l`.

| Group (label on screen) | Highlight | Pieces |
|---|---|---|
| Quadríceps | main mover | Rectus femoris muscle, Vastus lateralis muscle, Vastus medialis muscle, Vastus intermedius muscle |
| Glúteo máximo | main mover | Gluteus maximus muscle |
| Adutor magno | main mover | Adductor magnus |
| Isquiotibiais | support | Long head of biceps femoris, Short head of biceps femoris, Semitendinosus muscle, Semimembranosus muscle |
| Panturrilhas | support | Soleus muscle, Medial head of gastrocnemius, Lateral head of gastrocnemius |
| Eretores da espinha | support | Iliocostalis (colli, lumborum, thoracis), Longissimus (capitis, colli, thoracis), Spinalis (capitis, colli, thoracis) |

- The user approved the six groups and the two highlight styles. The roles are a draft until reviewed.
- Each style has a text label as well as a colour. Wording describes typical roles, never activation.
- Adductor minimus and semispinalis are left out **(my call: the first is listed separately in the atlas, the second is not part of the erector spinae)**.
- `Long head of biceps femoris` has no Portuguese name in the data; give it one **(my call)**.

## Screen
```
┌──────────────────────┐
│ Agachamento          │
│ ┌──────────────────┐ │
│ │ 3D view, angles  │ │  stays visible while the cards scroll
│ └──────────────────┘ │
│ ▶ ⏸  0,5×  1×        │
│ Início·Descida·Fundo·Subida
│ ┌ 2 · Descida ─────┐ │  active card: cues + muscles at work
│ └──────────────────┘ │
│ ┌ 3 · Fundo ───────┐ │
└──────────────────────┘
```
- Phases: Início, Descida, Fundo, Subida. Playback moves the active card; tapping a card or a phase jumps to its start and keeps the play or pause state **(my call)**.
- The view shows knee, hip and ankle angles that follow the movement. Say on screen which convention they use (0° = standing, measured as flexion) **(my call)**.
- Common mistakes: one collapsible text section after the cards **(my call)**.
- Entered from an "Exercícios" entry in the atlas header, with its own URL hash and a way back **(my call)**. The atlas keeps working as it does now.
- Wide screens: 3D view on the left, cards on the right **(my call)**.
- Playback starts paused. Muscle support groups can be hidden to see the joints **(my call)**.
- If the exercise fails to load, show an error with a retry button, as the atlas does.

## Movement
- We write it ourselves as joint angles over time. Both sides are symmetrical. Feet stay flat and still on the floor.
- The pelvis, spine, ribs and head move as one block that leans forward, keeping a neutral spine. Arms reach forward **(my call)**.
- Depth, trunk lean, ankle bend, tempo, cues and mistakes are drafts for the reviewer **(my call: start with thighs about parallel to the floor, with the body's weight over the feet)**. The test's pose was rough and is not the starting reference.
- Angles and tempo live in one data file, so a reviewer's correction means editing data and re-running the export.

## What the test showed
Right leg, quadriceps and glute max only, still renders. Scripts are in `.superpowers/spike/` (local, not in git; throwaway, reference only).

- The atlas source (`.cache/template/Z-Anatomy/Startup.blend`) lines up with the rest positions of the `Armature` bones in `Z-Biomechanics`. Right side, atlas coordinates in metres: hip (-0.083, 0.004, 0.861), knee (-0.081, 0.016, 0.455), ankle (-0.076, 0.042, 0.072). Mirror x for the left. -y is forward.
- Method that worked:
  1. Per muscle, a value from origin (0) to insertion (1), solved smoothly over the mesh from the `.or`/`.er` attachment patches. The quadriceps share `Quadriceps femoris muscle.er`; other `.o`/`.e` patches are partly missing.
  2. Bone weights from that value. Quadriceps also follow the patella, chosen by height around it. Weights smoothed over the mesh.
  3. Blender corrective smooth.
  4. Push vertices out of bone (no deeper than at rest, 2.5 mm margin) and spread the correction to neighbours.
  5. **Correct in small steps (80 were used), starting each from the previous one, then smooth the correction over time.** Correcting each position alone caused jumps of up to 65 mm.
- Result at the positions checked: one glute vertex more than 2 mm too deep (2.7 mm). The measure counts vertices only, against hip bone, femur, tibia and patella.
- Known flaws, left as finishing work: a tuft at the top of the rectus femoris when deep; ragged glute front edge (also in the source); two small spots of bone through the glute; uneven tendon below the knee. The hip's bony point is exposed, standing too.
- Not tested: playback as animation, the browser, a phone, the left side, and the adductor magnus, hamstrings, calves and back extensors.

## Parts
- **Export** (`tools/convert/`): a Blender script that reads the movement data, poses the bones, deforms the muscles, and writes one animated asset for the exercise. Repeatable from the fetched sources. Joint positions are stored in the repo, so `Z-Biomechanics` is not needed to export.
- **Exercise data**: phases, timings, joint angles, cues, mistakes, muscle roles, review status.
- **Player**: loads the asset only when the exercise is opened; play, pause, speed, seek, current phase and angles.
- **Screen**: cards, controls and 3D view.

## Delivery format and limits
The corrective smooth and the push-out do not run in the browser, so muscle shapes must be baked at several points in the movement. Bones move rigidly. In the test, 21 positions of five muscles on one leg were about 4 MB of raw position data; the full list is 22 pieces per side.

Limits **(my call)**:
- exercise download of 4 MB or less, compressed;
- 30 frames per second or more on a mid-range phone.

The format (morph targets or another), the number of stored positions and the polygon reduction are left to the builder.

## Order and checkpoints
1. **Delivery check first:** export the test's leg and play it in the browser. Measure size and frame rate, including on a real phone, and project them to the full list. Watch for jitter. If the limits look unreachable, stop and report before going further.
2. **Muscle check:** add the untested groups one at a time and show renders of each. The back extensors are the riskiest, since a one-block trunk changes them little but their lower ends cross the hip region. If a group cannot be made to look acceptable, stop and ask; do not drop or simplify it silently.
3. Both sides and the whole skeleton, then the screen and text.

## Review status
The exercise page shows "não revisado" until the review is done **(my call, follows the atlas descriptions)**. Cues and mistakes are drafted by AI, in original wording, and must avoid unsupported injury claims.

## Verification
- Unit tests: phase lookup by time, angle values, seeking, and that every listed muscle exists in the exported asset.
- Export checks: vertex penetration and frame-to-frame jumps for every muscle, reported as numbers. Targets: no vertex more than 3 mm deeper than at rest; no muscle's largest jump more than twice its value without the push-out **(my call)**.
- `npm test` and `npm run build`.
- In Chrome: play, pause, change speed, tap every card, rotate, phone-width layout, no console errors, and the atlas still works.
- The user looks at the animation before it is called done.

## Left to the builder
File layout, asset format, interpolation, colours (readable on the dark theme, distinct from bone), camera framing and component structure.
