import { expect, test } from 'vitest'
import { parseName, parseTranslations, isExcluded, toStructure, layerFor, isStructureName, assignIds } from '../tools/convert/names'

const csv = '﻿English;Latin;Français;Español;Portugues\nFemur;Os femoris;Fémur;Fémur;Fêmur\n(Adductor minimus);(Adductor minimus);x;x;(Adutor mínimo)'

test('parseName splits side and numeric suffix', () => {
  expect(parseName('Femur.l')).toEqual({ base: 'Femur', side: 'esquerdo' })
  expect(parseName('Femur.r.001')).toEqual({ base: 'Femur', side: 'direito' })
  expect(parseName(' Cuneus')).toEqual({ base: 'Cuneus', side: null })
})

test('parseTranslations keys by lowercased English, ignoring the BOM', () => {
  const t = parseTranslations(csv)
  expect(t.get('femur')).toEqual({ latin: 'Os femoris', pt: 'Fêmur' })
  expect(t.has('english')).toBe(false)
})

test('muscle attachment patches, labels and groups are not structures', () => {
  expect(isStructureName('Femur.l')).toBe(true)
  expect(isStructureName('Liver')).toBe(true)
  expect(isStructureName('Diaphragm.o2l')).toBe(false)
  expect(isStructureName('Abductor hallucis.er')).toBe(false)
  expect(isStructureName('Pharynx.j')).toBe(false)
  expect(isStructureName('Joints.g')).toBe(false)
})

test('layerFor maps numbered source collections', () => {
  expect(layerFor(['1: Skeletal system', 'Bonus collection'])).toBe('esqueleto')
  expect(layerFor(['6: Lymphoid organs'])).toBe('linfatico')
  expect(layerFor(['2: Muscular insertions'])).toBeNull()
  expect(layerFor(['9: Regions of human body'])).toBeNull()
  expect(layerFor(['Scene Collection'])).toBeNull()
})

test('inner ear and kidneys are excluded', () => {
  expect(isExcluded('Cochlea.l', [])).toBe(true)
  expect(isExcluded('Vestibule.r', ['Internal ear'])).toBe(true)
  expect(isExcluded('Kidney.l', [])).toBe(true)
  expect(isExcluded('Renal pelvis.r', [])).toBe(true)
  expect(isExcluded('Intrarenal veins of left kidney', [])).toBe(true)
})

test('similarly named structures are kept', () => {
  expect(isExcluded('Femur.l', ['Skeletal system'])).toBe(false)
  expect(isExcluded('Suprarenal gland.l', [])).toBe(false)
  expect(isExcluded('Left renal artery', [])).toBe(false)
  expect(isExcluded('Oral vestibule', ['Mouth'])).toBe(false)
  expect(isExcluded('Cochlear nerve', ['Cochlear nerve'])).toBe(false)
})

test('toStructure translates, including parenthesised names', () => {
  const t = parseTranslations(csv)
  expect(toStructure({ name: '(Adductor minimus).r' }, 'musculos', t)).toMatchObject({ namePt: '(Adutor mínimo)', side: 'direito', translated: true })
})

test('untranslated structures fall back to English, never blank', () => {
  expect(toStructure({ name: 'Unknown part' }, 'orgaos', new Map())).toMatchObject({ namePt: 'Unknown part', nameLatin: null, translated: false })
  const blank = new Map([['unknown part', { latin: '', pt: '' }]])
  expect(toStructure({ name: 'Unknown part' }, 'orgaos', blank)).toMatchObject({ namePt: 'Unknown part', nameLatin: null, translated: false })
})

test('assignIds gives unique ids safe for three.js node names', () => {
  const s = ['Cuneus.l', ' Cuneus.l', '(Adductor minimus).r'].map(name => toStructure({ name }, 'nervoso', new Map()))
  const ids = assignIds(s).map(x => x.id)
  expect(new Set(ids).size).toBe(3)
  for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
})

test('placeholder objects named with question marks are not structures', () => {
  expect(isStructureName('????????.l')).toBe(false)
  expect(isStructureName('?x')).toBe(false)
})

test('fascia and other soft tissues are split from the muscles', () => {
  const muscles = ['4: Muscular system']
  for (const n of ['Brachial fascia.l', 'Fascia lata.r', 'Anserine bursa.l', 'Subtendinous bursa of triceps brachii muscle.r', 'Common flexor tendon sheath.l', 'Flexor retinaculum of wrist.r', 'Lateral femoral intermuscular septum.l', 'Iliotibial tract.l', 'Plantar aponeurosis.l', 'Synovial sheaths of digits of hand.l'])
    expect(layerFor(muscles, n), n).toBe('tecidos')
  for (const n of ['Tensor fasciae latae.l', 'Sartorius muscle.l', 'Calcaneal tendon.r', 'Diaphragm'])
    expect(layerFor(muscles, n), n).toBe('musculos')
  expect(layerFor(['8: Visceral systems'], 'Synovial sheaths.l')).toBe('orgaos')
})

const row = (en: string, latin: string, pt: string) => parseTranslations(`English;Latin;Français;Español;Portugues\n${en};${latin};x;x;${pt}`)

test('known English or Latin leftovers get a Portuguese name', () => {
  for (const [en, pt] of [['Thalamus', 'Tálamo'], ['Pons', 'Ponte'], ['Testis', 'Testículo'], ['Incus', 'Bigorna'], ['Fascia lata', 'Fáscia lata']])
    expect(toStructure({ name: en }, 'nervoso', row(en, en, en))).toMatchObject({ namePt: pt, translated: true })
})
test('a name copied from English or Latin is flagged as untranslated', () => {
  expect(toStructure({ name: 'Some thing' }, 'orgaos', row('Some thing', 'Res quaedam', 'Some thing')).translated).toBe(false)
  expect(toStructure({ name: 'Some thing' }, 'orgaos', row('Some thing', 'Res quaedam', 'res quaedam')).translated).toBe(false)
})
test('identical spellings that are correct Portuguese stay translated', () => {
  expect(toStructure({ name: 'Retina.l' }, 'nervoso', row('Retina', 'Retina', 'Retina')).translated).toBe(true)
  expect(toStructure({ name: 'Tibia.l' }, 'esqueleto', row('Tibia', 'Tibia', 'Tíbia')).translated).toBe(true)
})
test('lymph nodes are called linfonodos', () => {
  expect(toStructure({ name: 'Central axillary nodes' }, 'linfatico', row('Central axillary nodes', 'Nodi axillares centrales', 'Nódulos axilares centrais')).namePt).toBe('Linfonodos axilares centrais')
  expect(toStructure({ name: '(Lacunar node)' }, 'linfatico', row('(Lacunar node)', '(Nodus lacunaris)', '(Nódulo lacunar)')).namePt).toBe('(Linfonodo lacunar)')
  expect(toStructure({ name: 'Nodule' }, 'nervoso', row('Nodule', 'Nodulus', 'Nódulo')).namePt).toBe('Nódulo')
})
