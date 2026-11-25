import { existsSync, readFileSync, statSync } from 'node:fs'
import { expect, test } from 'vitest'
import { LAYER_IDS, type Structure } from '../src/types'
import { isExcluded } from '../tools/convert/names'

const structures: Structure[] = JSON.parse(readFileSync('public/data/structures.json', 'utf8'))
const path = (layer: string) => `public/models/${layer}.glb`

function glb(layer: string) {
  const buf = readFileSync(path(layer))
  return JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))
}

test.each(LAYER_IDS)('%s.glb has exactly one mesh node per structure', layer => {
  expect(existsSync(path(layer))).toBe(true)
  const names = glb(layer).nodes.filter((n: any) => n.mesh !== undefined).map((n: any) => n.name).sort()
  expect(names).toEqual(structures.filter(s => s.layer === layer).map(s => s.id).sort())
})

test('no excluded structure is published', () => {
  expect(structures.filter(s => isExcluded(s.sourceName, []))).toEqual([])
})

test('size and triangle budgets', () => {
  const sizes = LAYER_IDS.map(l => statSync(path(l)).size)
  for (const s of sizes) expect(s).toBeLessThanOrEqual(15e6)
  expect(sizes.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(40e6)
  let triangles = 0
  for (const layer of LAYER_IDS) {
    const g = glb(layer)
    for (const m of g.meshes) for (const p of m.primitives) triangles += g.accessors[p.indices].count / 3
  }
  expect(triangles).toBeLessThanOrEqual(3e6)
})
