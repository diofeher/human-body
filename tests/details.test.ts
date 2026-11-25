import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { DESCRIPTIONS, describe as describeStructure } from '../src/data/descriptions'
import { parseName } from '../tools/convert/names'
import { LAYER_IDS, type Structure } from '../src/types'

const all: Structure[] = JSON.parse(readFileSync('public/data/structures.json', 'utf8'))
const find = (base: string) => all.filter(s => parseName(s.sourceName).base === base)

test('an undescribed structure says the description is in preparation', () => {
  const s = { ...all[0], sourceName: 'Nada disso' }
  expect(describeStructure(s)).toEqual({ text: 'Descrição em preparação', badge: null, hasText: false })
})
test('an unreviewed description is marked', () => {
  expect(describeStructure(find('Femur')[0])).toMatchObject({ badge: 'não revisado', hasText: true })
})
test('left and right share one description', () => {
  const [a, b] = find('Femur')
  expect(describeStructure(a).text).toBe(describeStructure(b).text)
})
test('every description matches a structure and none is marked reviewed yet', () => {
  expect(Object.keys(DESCRIPTIONS).filter(k => find(k).length === 0)).toEqual([])
  expect(Object.values(DESCRIPTIONS).filter(d => d.reviewed)).toEqual([])
})
test('at least 50 descriptions covering all layers', () => {
  expect(Object.keys(DESCRIPTIONS).length).toBeGreaterThanOrEqual(50)
  const layers = new Set(Object.keys(DESCRIPTIONS).flatMap(k => find(k).map(s => s.layer)))
  expect([...layers].sort()).toEqual([...LAYER_IDS].sort())
})
test('a name that matches an inherited object property has no description', () => {
  expect(describeStructure({ ...all[0], sourceName: 'constructor' }).hasText).toBe(false)
})
