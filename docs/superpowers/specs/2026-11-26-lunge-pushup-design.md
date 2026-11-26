# Lunge and push-up (design)

The user asked for more exercises, to be committed and reviewed afterwards. No design questions were
asked, so **every choice here is the builder's and open to change**. Intent, goals, screen, constraints
and the rule against merging before professional review are those of
`2026-11-26-squat-animation-design.md`.

## Scope
The two exercises `TODO.md` names: lunge (`#avanco`) and push-up (`#flexao`).

## Approaches
- **Generalise the squat exporter and screen (chosen).** One pipeline, one screen, data per exercise.
- A separate script per exercise: simpler each, but the muscle and collision code would be copied.

## Movement
- **Lunge:** a stationary split squat (feet stay in place), not a stepping lunge. Right leg in front;
  a text cue says to swap legs. Arms hang. Each leg is posed from hip and ankle positions; the back
  heel is raised and the toes stay flat.
- **Push-up:** full push-up on hands and toes. Hands stay fixed, body stays straight, elbows point
  back and out. No knee or incline version (mentioned in a "common mistakes" text only).

## Muscles
| Exercise | Main movers | Support |
|---|---|---|
| Lunge | quadriceps, gluteus maximus, adductor magnus | gluteus medius, hamstrings, calves |
| Push-up | pectoralis major, triceps, anterior deltoid | serratus anterior, rectus abdominis |

## Simplifications a reviewer should know
- The scapula and clavicle do not move. In a real push-up the scapula does.
- The spine and neck are one rigid block with the pelvis.
- Serratus anterior and rectus abdominis ride with the trunk without changing shape.
- Both lunge hips stay level; the pelvis does not tilt or turn.

## Export changes
- The arm is split into humerus, ulna, radius and hand, so the forearm can pronate. This also turns
  the squat's palms from facing up to facing down.
- Lunge and push-up first travel from the atlas rest pose to their starting position.
- A two-sided movement also exports `left-muscle-*` shapes and `leftSegments`.
- Every stored depth now has its own muscle shape, including the first.
- On-screen angles come from the exported manifest.
