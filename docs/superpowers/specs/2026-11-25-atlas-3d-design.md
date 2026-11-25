# Atlas 3D do corpo humano (design)

## Context
A free educational web page, all in Portuguese (pt-BR assumed): a 3D human body with layers you can filter. Clicking a structure shows its details in a side panel.
Chosen by the user: Z-Anatomy as the 3D source, free educational site.
State today: the private repo `diofeher/human-body` is created and linked, with no commits. Node 23 is installed. Blender is not.

## Approaches
1. **Static site with Three.js, Vite and TypeScript, with models converted ahead of time (recommended).** Full control over layers, picking and panel. No server. Needs a one-off conversion step.
2. React with react-three-fiber. Same engine and easier for a larger UI, but more dependencies than one screen needs.
3. Embed or adapt the Z-Anatomy Unity app. It reuses existing features, but it's a PC app project, heavy to adapt for the web and hard to customize.

## First version
- **Layers:** show/hide and opacity for skeleton, joints, muscles, cardiovascular, nervous, organs and lymphatic. Skin and other tissues only if the source files really contain them; confirm this first.
- **Interaction:** rotate, zoom, pan; hover and click highlight; isolate or hide a structure; search by Portuguese name; reset view.
- **Side panel:** Portuguese name, Latin name, system, description and source. On narrow screens it moves to the bottom.
- **Descriptions:** every structure gets a panel. Start with about 50 main structures with short original pt-BR text, drafted by AI and visibly marked "não revisado" until a qualified person reviews it. The rest show "Descrição em preparação". No automatically translated Wikipedia text.
- **Loading:** one compressed GLB per layer, loaded when first enabled, with a progress indicator.
- **Out of scope:** quizzes, female model, animation, accounts, backend, public deployment.

## Licensing requirements
- Use the official `Z-Anatomy/Models-of-human-anatomy` repo (its `License.txt` was read). Record the commit used.
- Exclude the inner ear and kidneys. Check the object names to find them; credits don't map sources to pieces, so some risk remains. BodyParts3D kidneys are a later option.
- Portuguese names come from `Resources/Translations0.txt` in `LluisV/Z-Anatomy` (repo README says CC BY-SA 4.0). Its linked Google Doc on model terms is unread; read it before using the file. Flag names that look European Portuguese or untranslated.
- A visible "Créditos" page with the attribution lines from `License.txt`, licence links and a list of our changes. Add the BodyParts3D CC BY 4.0 line only if we use files from its archive.
- Converted models and adapted data are CC BY-SA 4.0 (`LICENSE-ASSETS`). The app code's licence is the owner's decision and stays unset for now.
- Page states it is educational and not medical advice.

## Parts
- `tools/convert/`: download the source, run Blender headless to export per-layer GLB (names preserved, excluded parts dropped, polygons reduced), compress with gltf-transform/meshopt, write `structures.json`.
- `src/scene/` (loading, camera, picking), `src/ui/` (layers, search, panel, credits), `src/data/` (descriptions).
- Installs Blender through Homebrew. Source downloads stay out of git; the generated GLBs are committed if their size allows.

## First risk to test
Open the source `.blend` and confirm that structures are separate named objects, that names match the translation list (report the match rate), which layers exist, and the size after compression. If any of this fails, stop and report before building the UI.

## Verification
- Unit tests for name matching, excluded parts and layer state.
- `npm run build`.
- In Chrome: toggle every layer, click structures and check the panel, search in Portuguese, check the credits page, confirm no console errors, and check load size and frame rate.

