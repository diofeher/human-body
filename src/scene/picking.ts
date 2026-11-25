export function pickable(hits: { id: string; visible: boolean }[]): string | null {
  return hits.find(h => h.visible)?.id ?? null
}

type Point = { x: number; y: number }
export const isClick = (down: Point, up: Point, tolerance = 5) => Math.hypot(up.x - down.x, up.y - down.y) <= tolerance
