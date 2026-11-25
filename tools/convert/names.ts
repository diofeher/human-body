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

// The source list repeats the English or Latin term for these; corrected here, pending review
const PT_FIXES: Record<string, string> = {
  '(opponens digiti minimi muscle of foot)': '(Músculo oponente do dedo mínimo do pé)',
  'adductor longus': 'Músculo adutor longo',
  'chorda tympani': 'Corda do tímpano',
  'culmen': 'Cúlmen',
  'cuneus': 'Cúneo',
  'ductus deferens': 'Ducto deferente',
  'extensor carpi radialis brevis': 'Músculo extensor radial curto do carpo',
  'extensor carpi radialis longus': 'Músculo extensor radial longo do carpo',
  'extensor digiti minimi': 'Músculo extensor do dedo mínimo',
  'extensor digitorum brevis': 'Músculo extensor curto dos dedos',
  'extensor digitorum longus': 'Músculo extensor longo dos dedos',
  'extensor digitorum': 'Músculo extensor dos dedos',
  'extensor hallucis brevis': 'Músculo extensor curto do hálux',
  'extensor hallucis longus': 'Músculo extensor longo do hálux',
  'extensor indicis': 'Músculo extensor do indicador',
  'extensor pollicis longus': 'Músculo extensor longo do polegar',
  'falx cerebri': 'Foice do cérebro',
  'fascia lata': 'Fáscia lata',
  'flexor carpi radialis': 'Músculo flexor radial do carpo',
  'flexor digitorum brevis': 'Músculo flexor curto dos dedos',
  'flexor digitorum longus': 'Músculo flexor longo dos dedos',
  'flexor hallucis longus': 'Músculo flexor longo do hálux',
  'flocculus': 'Flóculo',
  'fornix': 'Fórnice',
  'glans penis': 'Glande do pênis',
  'globus pallidus': 'Globo pálido',
  'habenula': 'Habênula',
  'incus': 'Bigorna',
  'linea alba': 'Linha alba',
  'nucleus proprius': 'Núcleo próprio',
  'pons': 'Ponte',
  'precuneus': 'Pré-cúneo',
  'psoas major': 'Músculo psoas maior',
  'rotatores': 'Músculos rotadores',
  'semimembranosus bursa': 'Bolsa do músculo semimembranáceo',
  'stria medullaris thalami': 'Estria medular do tálamo',
  'stria terminalis': 'Estria terminal',
  'supinator': 'Músculo supinador',
  'talus': 'Tálus',
  'tentorium cerebelli': 'Tentório do cerebelo',
  'testis': 'Testículo',
  'thalamus': 'Tálamo',
  'vertebra t10': 'Vértebra T10',
  'vertebra t11': 'Vértebra T11',
}

// spelled the same in Portuguese and in English or Latin
const SAME_SPELLING = new Set(['atlas (c1)', 'cauda equina', 'declive', 'olive', 'pleura', 'putamen', 'retina', 'ulna', 'ureter'])

export function toStructure(item: { name: string }, layer: LayerId, translations: Translations): Structure {
  const { base, side } = parseName(item.name)
  const key = base.toLowerCase()
  const entry = translations.get(key) ?? translations.get(key.replace(/\*/g, ''))
  const clean = (s: string) => s.replace(/\*/g, '').trim()
  const latin = clean(entry?.latin ?? '')
  const listed = clean(entry?.pt ?? '')
  const englishKey = clean(key)
  const fixed = Object.hasOwn(PT_FIXES, englishKey) ? PT_FIXES[englishKey] : null
  // accents matter: "Tíbia" is a translation of "Tibia"
  const copied = [englishKey, latin.toLowerCase()].includes(listed.toLowerCase()) && !SAME_SPELLING.has(englishKey)
  let namePt = fixed ?? (copied ? '' : listed)
  // "Nodus/Nodi" in Latin means a lymph node, which pt-BR calls "linfonodo"
  if (/^\(?Nod(us|i)\b/.test(latin)) namePt = namePt.replace(/Nódulo/g, 'Linfonodo').replace(/nódulo/g, 'linfonodo')
  return {
    id: '', sourceName: item.name, layer, side,
    namePt: namePt || clean(base),
    nameLatin: latin || null,
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
