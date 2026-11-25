import { expect, test } from 'vitest'
import { pickable, isClick } from '../src/scene/picking'

test('the first visible hit is picked', () => {
  expect(pickable([{ id: 'a', visible: false }, { id: 'b', visible: true }])).toBe('b')
  expect(pickable([{ id: 'a', visible: false }])).toBeNull()
  expect(pickable([])).toBeNull()
})
test('a drag is not a click', () => {
  expect(isClick({ x: 10, y: 10 }, { x: 12, y: 11 })).toBe(true)
  expect(isClick({ x: 10, y: 10 }, { x: 40, y: 10 })).toBe(false)
})
