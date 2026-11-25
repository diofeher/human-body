import { expect, test } from 'vitest'
import { search } from '../src/ui/search-core'
import type { Structure } from '../src/types'

const s = (namePt: string, extra: Partial<Structure> = {}): Structure =>
  ({ id: namePt, sourceName: namePt, layer: 'esqueleto', namePt, nameLatin: null, side: null, translated: true, ...extra })
const list = [s('Artéria femoral'), s('Fêmur'), s('Músculo sartório'), s('Osso frontal', { nameLatin: 'Os frontale' })]

test('finds without accents, best match first', () => {
  expect(search('femur', list)[0].namePt).toBe('Fêmur')
  expect(search('MUSCULO', list).map(x => x.namePt)).toContain('Músculo sartório')
})
test('matches Latin names and words in any order', () => {
  expect(search('frontale', list)[0].namePt).toBe('Osso frontal')
  expect(search('femoral arteria', list)[0].namePt).toBe('Artéria femoral')
})
test('empty query returns nothing and limit applies', () => {
  expect(search('  ', list)).toEqual([])
  expect(search('o', list, 2).length).toBe(2)
})
