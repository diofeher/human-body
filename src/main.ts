import './style.css'
import type { Structure } from './types.ts'
import { createViewer } from './scene/viewer.ts'
import { createLayerStore } from './state/layers.ts'
import { createLayersPanel } from './ui/layers-panel.ts'
import { createSearch } from './ui/search.ts'

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

async function start() {
  const response = await fetch(`${import.meta.env.BASE_URL}data/structures.json`)
  if (!response.ok) throw new Error(`structures.json: ${response.status}`)
  const structures: Structure[] = await response.json()

  let panel: ReturnType<typeof createLayersPanel> | null = null
  const viewer = createViewer(element('viewer'), (layer, fraction) => panel?.progress(layer, fraction))
  const store = createLayerStore(layer => viewer.load(layer))
  viewer.attach(store)
  panel = createLayersPanel(element('layers'), store)

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
