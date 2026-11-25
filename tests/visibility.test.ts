import { expect, test } from 'vitest'
import { isShown, layerWasTurnedOn } from '../src/scene/visibility'

const on = { visible: true, opacity: 1 }

test('isolation shows only the isolated structure', () => {
  expect(isShown('a', on, new Set(), 'a')).toBe(true)
  expect(isShown('b', on, new Set(), 'a')).toBe(false)
})
test('switching a layer off hides even the isolated structure', () => {
  expect(isShown('a', { visible: false, opacity: 1 }, new Set(), 'a')).toBe(false)
  expect(isShown('a', { visible: true, opacity: 0 }, new Set(), 'a')).toBe(false)
})
test('hidden structures stay hidden', () => {
  expect(isShown('a', on, new Set(['a']), null)).toBe(false)
})
test('turning another layer on is detected, so isolation can end', () => {
  expect(layerWasTurnedOn(new Set(['esqueleto']), new Set(['esqueleto', 'musculos']))).toBe(true)
  expect(layerWasTurnedOn(new Set(['esqueleto']), new Set())).toBe(false)
  expect(layerWasTurnedOn(new Set(['esqueleto']), new Set(['esqueleto']))).toBe(false)
})
