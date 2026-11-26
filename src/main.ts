import './style.css'
import type { Structure } from './types.ts'
import { createViewer } from './scene/viewer.ts'
import { createLayerStore } from './state/layers.ts'
import { createLayersPanel } from './ui/layers-panel.ts'
import { createSearch } from './ui/search.ts'
import { createDetailsPanel } from './ui/details-panel.ts'
import { setupCredits } from './ui/credits.ts'

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

let exercise: Promise<{ open(): void; close(): void }> | null = null
function route() {
  const active = location.hash === '#agachamento'
  document.querySelector('main')!.hidden = active
  element('open-exercise').hidden = active
  element('exercise').hidden = !active
  if (!active) {
    void exercise?.then(screen => screen.close())
    return
  }
  exercise ??= import('./exercises/screen.ts').then(m => m.createExerciseScreen(element('exercise')))
  // the hash may have changed again while the code was loading
  exercise.then(screen => (location.hash === '#agachamento' ? screen.open() : screen.close()), error => {
    console.error(error)
    exercise = null
    element('exercise').innerHTML = '<p class="exercise-load-error">Não foi possível abrir o exercício. Recarregue a página.</p>'
  })
}
window.addEventListener('hashchange', route)
route()

async function start() {
  setupCredits(element<HTMLDialogElement>('credits'), element('open-credits'))
  const response = await fetch(`${import.meta.env.BASE_URL}data/structures.json`)
  if (!response.ok) throw new Error(`structures.json: ${response.status}`)
  const structures: Structure[] = await response.json()

  let panel: ReturnType<typeof createLayersPanel> | null = null
  const viewer = createViewer(element('viewer'), (layer, fraction) => panel?.progress(layer, fraction))
  const store = createLayerStore(layer => viewer.load(layer))
  viewer.attach(store)
  panel = createLayersPanel(element('layers'), store)

  const byId = new Map(structures.map(s => [s.id, s]))
  const showDetails = createDetailsPanel(element('details'), {
    isolate: id => { viewer.isolate(id); viewer.focus(id) },
    hide: id => viewer.hide(id),
    showAll: () => viewer.reset(),
  })
  viewer.onSelect(id => showDetails(id ? byId.get(id) ?? null : null))
  showDetails(null)

  createSearch(element<HTMLInputElement>('search'), element('results'), structures, async s => {
    if (store.get(s.layer).opacity === 0) store.setOpacity(s.layer, 1)
    await store.setVisible(s.layer, true)
    if (store.get(s.layer).status !== 'ready' || !store.get(s.layer).visible) return
    viewer.reveal(s.id)
    viewer.select(s.id)
    viewer.focus(s.id)
  })
  element('reset').addEventListener('click', () => viewer.reset())
  void store.setVisible('esqueleto', true)
}

start().catch(error => {
  console.error(error)
  const box = element('viewer')
  box.innerHTML = '<div class="fatal"><p>Não foi possível iniciar o atlas.</p><button type="button">Tentar novamente</button></div>'
  box.querySelector('button')!.addEventListener('click', () => location.reload())
})
