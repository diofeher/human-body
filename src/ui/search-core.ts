import type { Structure } from '../types.ts'

export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function search(query: string, list: Structure[], limit = 20): Structure[] {
  const q = normalize(query)
  if (!q) return []
  const words = q.split(/\s+/)
  const scored: { s: Structure; score: number }[] = []
  for (const s of list) {
    const name = normalize(s.namePt)
    const all = `${name} ${normalize(s.nameLatin ?? '')}`
    if (!words.every(w => all.includes(w))) continue
    const score = name === q ? 0 : name.startsWith(q) ? 1 : name.includes(q) ? 2 : 3
    scored.push({ s, score })
  }
  return scored
    .sort((a, b) => a.score - b.score || a.s.namePt.length - b.s.namePt.length || a.s.namePt.localeCompare(b.s.namePt, 'pt-BR'))
    .slice(0, limit)
    .map(x => x.s)
}
