export function setupMenu({ toggle, close, panel, backdrop }: Record<'toggle' | 'close' | 'panel' | 'backdrop', HTMLElement>) {
  const set = (open: boolean) => {
    panel.classList.toggle('open', open)
    backdrop.classList.toggle('open', open)
    toggle.setAttribute('aria-expanded', String(open))
  }
  const dismiss = () => { set(false); toggle.focus() }
  toggle.addEventListener('click', () => { set(true); close.focus() })
  close.addEventListener('click', dismiss)
  backdrop.addEventListener('click', dismiss)
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') dismiss() })
  return { close: () => set(false) }
}
