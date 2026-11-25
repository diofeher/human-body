import type { Structure } from '../types.ts'
import { describe } from '../data/descriptions.ts'
import { LAYER_LABELS } from './labels.ts'

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.textContent = text
  node.className = className
  return node
}

export function createDetailsPanel(root: HTMLElement, actions: { isolate(id: string): void; hide(id: string): void; showAll(): void }) {
  return function show(s: Structure | null) {
    if (!s) {
      root.replaceChildren(el('p', 'Clique em uma estrutura do corpo ou use a busca para ver os detalhes.', 'muted'))
      return
    }
    const description = describe(s)
    const list = el('dl')
    const row = (label: string, value: string) => list.append(el('dt', label), el('dd', value))
    if (s.side) row('Lado', s.side)
    row('Nome em latim', s.nameLatin ?? 'Não informado')
    row('Sistema', LAYER_LABELS[s.layer])

    const buttons = el('div', '', 'actions')
    const button = (label: string, run: () => void) => {
      const b = el('button', label)
      b.type = 'button'
      b.addEventListener('click', run)
      buttons.append(b)
    }
    button('Isolar', () => actions.isolate(s.id))
    button('Ocultar', () => actions.hide(s.id))
    button('Mostrar tudo', () => actions.showAll())

    const nodes: HTMLElement[] = [el('h2', s.namePt)]
    if (!s.translated) nodes.push(el('span', 'sem tradução', 'badge'))
    nodes.push(list)
    if (description.badge) nodes.push(el('span', description.badge, 'badge'))
    nodes.push(el('p', description.text, description.hasText ? '' : 'muted'))
    if (description.badge) nodes.push(el('p', 'Texto redigido com IA, ainda sem revisão de um profissional.', 'muted'))
    nodes.push(buttons, el('p', 'Fonte do modelo e do nome: Z-Anatomy e BodyParts3D. Veja Créditos e licenças.', 'muted'))
    root.replaceChildren(...nodes)
  }
}
