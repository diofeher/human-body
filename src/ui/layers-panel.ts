import { LAYER_IDS, type LayerId } from '../types.ts'
import type { LayerStore } from '../state/layers.ts'
import { LAYER_COLORS, LAYER_LABELS } from './labels.ts'

export function createLayersPanel(root: HTMLElement, store: LayerStore) {
  const progress = new Map<LayerId, number>()
  const updates: (() => void)[] = []

  for (const id of LAYER_IDS) {
    const item = document.createElement('li')
    item.innerHTML = `
      <label class="layer-toggle"><input type="checkbox"><span class="swatch"></span><span class="layer-name"></span></label>
      <input class="opacity" type="range" min="0" max="100">
      <p class="status" role="status"></p>
      <button class="retry" type="button" hidden>Tentar novamente</button>`
    const find = <T extends Element>(q: string) => item.querySelector(q) as unknown as T
    const check = find<HTMLInputElement>('input[type=checkbox]')
    const range = find<HTMLInputElement>('.opacity')
    const status = find<HTMLElement>('.status')
    const retry = find<HTMLButtonElement>('.retry')
    find<HTMLElement>('.layer-name').textContent = LAYER_LABELS[id]
    find<HTMLElement>('.swatch').style.background = LAYER_COLORS[id]
    range.setAttribute('aria-label', `Opacidade: ${LAYER_LABELS[id]}`)
    check.addEventListener('change', () => void store.setVisible(id, check.checked))
    range.addEventListener('input', () => store.setOpacity(id, Number(range.value) / 100))
    retry.addEventListener('click', () => void store.setVisible(id, true))
    updates.push(() => {
      const s = store.get(id)
      check.checked = s.visible
      range.value = String(Math.round(s.opacity * 100))
      range.hidden = !s.visible
      const percent = Math.round((progress.get(id) ?? 0) * 100)
      status.textContent = s.status === 'loading' ? `Carregando… ${percent ? `${percent}%` : ''}`
        : s.status === 'error' ? 'Não foi possível carregar esta camada.' : ''
      retry.hidden = s.status !== 'error'
    })
    root.appendChild(item)
  }
  const refresh = () => updates.forEach(fn => fn())
  store.subscribe(refresh)
  refresh()
  return { progress(id: LayerId, fraction: number) { progress.set(id, fraction); refresh() } }
}
