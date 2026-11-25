import type { LayerId, Structure } from '../../src/types.ts'

export type Translations = Map<string, { latin: string; pt: string }>

export function parseName(raw: string): { base: string; side: Structure['side'] } {
  let name = raw.trim().replace(/\.\d{3}$/, '')
  const m = name.match(/\.([lr])$/)
  if (m) name = name.slice(0, -2)
  return { base: name.trim(), side: m ? (m[1] === 'l' ? 'esquerdo' : 'direito') : null }
}

// ".ol"/".e2r" are muscle attachment patches; ".j", ".g" and the like are labels and groups
export function isStructureName(raw: string): boolean {
  if (raw.trim().startsWith('?')) return false
  const m = raw.trim().replace(/\.\d{3}$/, '').match(/\.([a-z]\d*[lr]?)$/)
  return !m || m[1] === 'l' || m[1] === 'r'
}

const LAYER_BY_NUMBER: Record<string, LayerId> = {
  '1': 'esqueleto', '3': 'articulacoes', '4': 'musculos', '5': 'cardiovascular',
  '6': 'linfatico', '7': 'nervoso', '8': 'orgaos',
}

// sheets and sacs that wrap the muscles and would hide them
const SOFT_TISSUE = /\bfascia\b|bursa|sheath|retinaculum|intermuscular septum|iliotibial tract|aponeurosis|fat pad/i

export function layerFor(collections: string[], name = ''): LayerId | null {
  for (const c of collections) {
    const m = c.match(/^(\d):/)
    const layer = m ? LAYER_BY_NUMBER[m[1]] : undefined
    if (layer) return layer === 'musculos' && SOFT_TISSUE.test(name) ? 'tecidos' : layer
  }
  return null
}

const EXCLUDED_COLLECTIONS = new Set(['Internal ear', 'Bony labyrinth', 'Cochlea'])
const EXCLUDED_NAMES = /^(cochlea|vestibule|kidney|renal pelvis|intrarenal .*)$/i

// The credits list non-commercial sources for the inner ear and a kidney model
export function isExcluded(name: string, collections: string[]): boolean {
  return collections.some(c => EXCLUDED_COLLECTIONS.has(c)) || EXCLUDED_NAMES.test(parseName(name).base)
}

export function parseTranslations(csv: string): Translations {
  const [header, ...rows] = csv.replace(/^﻿/, '').split(/\r?\n/)
  const columns = header.split(';')
  const latin = columns.indexOf('Latin')
  const pt = columns.indexOf('Portugues')
  if (latin < 0 || pt < 0) throw new Error(`Unexpected translation header: ${header}`)
  const map: Translations = new Map()
  for (const row of rows) {
    const cells = row.split(';')
    const key = cells[0]?.trim().toLowerCase()
    if (key && !map.has(key)) map.set(key, { latin: (cells[latin] ?? '').trim(), pt: (cells[pt] ?? '').trim() })
  }
  return map
}

export function toStructure(item: { name: string }, layer: LayerId, translations: Translations): Structure {
  const { base, side } = parseName(item.name)
  const key = base.toLowerCase()
  const entry = translations.get(key) ?? translations.get(key.replace(/\*/g, ''))
  const clean = (s: string) => s.replace(/\*/g, '').trim()
  const namePt = clean(entry?.pt ?? '')
  return {
    id: '', sourceName: item.name, layer, side,
    namePt: namePt || clean(base),
    nameLatin: clean(entry?.latin ?? '') || null,
    translated: namePt !== '',
  }
}

export function assignIds(list: Structure[]): Structure[] {
  const used = new Set<string>()
  return list.map(s => {
    const base = parseName(s.sourceName).base.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'estrutura'
    const stem = s.side ? `${base}-${s.side[0]}` : base
    let id = stem
    for (let n = 2; used.has(id); n++) id = `${stem}-${n}`
    used.add(id)
    return { ...s, id }
  })
}
