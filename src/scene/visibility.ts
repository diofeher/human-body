export function isShown(id: string, layer: { visible: boolean; opacity: number }, hidden: Set<string>, isolated: string | null): boolean {
  if (!layer.visible || layer.opacity <= 0 || hidden.has(id)) return false
  return isolated === null || id === isolated
}

export const layerWasTurnedOn = (before: Set<string>, after: Set<string>) => [...after].some(id => !before.has(id))
