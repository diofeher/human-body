import { expect, test } from 'vitest'
import squatJson from '../src/exercises/squat.json'
import type { Exercise } from '../src/exercises/types'
import { advance, blend, depthAt, duration, phaseAt, phaseStart, valueAt, wrapTime } from '../src/exercises/timeline'

const squat = squatJson as Exercise

test('phases follow time and wrap around the cycle', () => {
  expect(duration(squat)).toBe(6.5)
  expect(phaseAt(squat, 0).phase.id).toBe('inicio')
  expect(phaseAt(squat, 1).phase.id).toBe('descida')
  expect(phaseAt(squat, 6.5).index).toBe(0)
  expect(phaseAt(squat, -0.1).phase.id).toBe('subida')
  expect(wrapTime(squat, -0.5)).toBeCloseTo(6)
  squat.phases.forEach((p, i) => expect(phaseAt(squat, phaseStart(squat, i)).phase.id).toBe(p.id))
})

test('depth goes down, holds and comes back', () => {
  expect(depthAt(squat, 0.5)).toBe(0)
  expect(depthAt(squat, 2.25)).toBeCloseTo(0.5)
  expect(depthAt(squat, 4)).toBe(1)
  expect(depthAt(squat, 5.5)).toBeCloseTo(0.5)
})

test('shown values are blended between stored depths', () => {
  expect(valueAt([0, 50, 100], 0)).toBe(0)
  expect(valueAt([0, 50, 100], 0.75)).toBe(75)
  expect(valueAt([0, 50, 100], 1)).toBe(100)
})

test('blend picks the two stored depths around a value', () => {
  expect(blend(0, 11)).toEqual({ a: 0, b: 1, mix: 0 })
  expect(blend(1, 11)).toEqual({ a: 9, b: 10, mix: 1 })
  const middle = blend(0.55, 11)
  expect([middle.a, middle.b]).toEqual([5, 6])
  expect(middle.mix).toBeCloseTo(0.5)
})

test('a long frame gap does not skip through the movement', () => {
  expect(advance(squat, 0, 30, 1)).toBeCloseTo(0.1)
  expect(advance(squat, 6.45, 0.1, 1)).toBeCloseTo(0.05)
  expect(advance(squat, 1, 0.1, 0.5)).toBeCloseTo(1.05)
})

test('six muscle groups, 22 pieces, each group with a role', () => {
  expect(squat.groups).toHaveLength(6)
  expect(squat.groups.flatMap(g => g.pieces)).toHaveLength(22)
  for (const g of squat.groups) expect(['principal', 'apoio']).toContain(g.role)
})
