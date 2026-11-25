import type { Structure } from '../types.ts'
import { LAYER_LABELS, displayName } from './labels.ts'
import { search } from './search-core.ts'

export function createSearch(input: HTMLInputElement, results: HTMLElement, list: Structure[], onPick: (s: Structure) => void) {
  let current: Structure[] = []
  const close = () => { results.replaceChildren(); current = [] }
  const choose = (s: Structure) => { input.value = ''; close(); onPick(s) }

  input.addEventListener('input', () => {
    close()
    current = search(input.value, list)
    for (const s of current) {
      const button = document.createElement('button')
      button.type = 'button'
      const small = document.createElement('small')
      small.textContent = LAYER_LABELS[s.layer]
      button.append(displayName(s), small)
      button.addEventListener('click', () => choose(s))
      const item = document.createElement('li')
      item.appendChild(button)
      results.appendChild(item)
    }
    if (!current.length && input.value.trim()) {
      const item = document.createElement('li')
      item.textContent = 'Nenhum resultado.'
      results.appendChild(item)
    }
  })
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && current[0]) choose(current[0])
    if (e.key === 'Escape') { input.value = ''; close() }
  })
}
