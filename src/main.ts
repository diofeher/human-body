import './style.css'
import type { Structure } from './types.ts'
import { createViewer } from './scene/viewer.ts'
import { createLayerStore } from './state/layers.ts'
import { createLayersPanel } from './ui/layers-panel.ts'
import { createSearch } from './ui/search.ts'
import { createDetailsPanel } from './ui/details-panel.ts'
import { setupCredits } from './ui/credits.ts'
import { setupMenu } from './ui/menu.ts'

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

type Screen = { open(): void; close(): void }
const EXERCISE_HASHES = ['#agachamento', '#avanco', '#flexao', '#ponte', '#panturrilha']
/** one screen per exercise, built the first time it is opened */
const screens = new Map<string, Promise<Screen>>()

function route() {
  const hash = location.hash
  const active = EXERCISE_HASHES.includes(hash)
  document.querySelector('main')!.hidden = active
  element('open-exercise').hidden = active
  element('exercise').hidden = !active
  for (const [other, screen] of screens) if (other !== hash) void screen.then(s => s.close())
  for (const box of element('exercise').children) (box as HTMLElement).hidden = box.id !== `screen-${hash.slice(1)}`
  if (!active) return
  let screen = screens.get(hash)
  if (!screen) {
    const box = document.createElement('div')
    box.id = `screen-${hash.slice(1)}`
    box.className = 'exercise-screen'
    element('exercise').append(box)
    screen = import('./exercises/screen.ts').then(m => m.createExerciseScreen(box, m.EXERCISES[hash.slice(1)]))
    screens.set(hash, screen)
    screen.catch(error => {
      console.error(error)
      screens.delete(hash)
      box.innerHTML = '<p class="exercise-load-error">Não foi possível abrir o exercício. Recarregue a página.</p>'
    })
  }
  // the hash may have changed again while the code was loading
  screen.then(s => (location.hash === hash ? s.open() : s.close()), () => {})
}
window.addEventListener('hashchange', route)
route()

async function start() {
  const menu = setupMenu({
    toggle: element('menu-toggle'), close: element('menu-close'),
    panel: element('controls'), backdrop: element('menu-backdrop'),
  })
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
    menu.close()
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
