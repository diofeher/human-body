import { readFileSync, statSync } from 'node:fs'
import { expect, test } from 'vitest'
import squat from '../src/exercises/squat.json'
import type { ExerciseManifest } from '../src/exercises/types'
import { muscleNode } from '../src/exercises/types'

const GLB = 'public/exercises/squat.glb'
const MANIFEST = 'public/exercises/squat.json'
const manifest = (): ExerciseManifest => JSON.parse(readFileSync(MANIFEST, 'utf8'))
const gltf = () => {
  const buf = readFileSync(GLB)
  return JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))
}

test('every listed muscle is in the asset, with one shape per stored depth', () => {
  const g = gltf()
  for (const piece of squat.groups.flatMap(group => group.pieces)) {
    const node = g.nodes.find((n: any) => n.name === muscleNode(piece.name))
    expect(node, piece.name).toBeDefined()
    const targets = g.meshes[node.mesh].primitives[0].targets?.length ?? 0
    expect(targets, piece.name).toBe(piece.kind === 'trunk' ? 0 : squat.depths - 1)
  }
})

test('every bone segment has one matrix per stored depth', () => {
  const m = manifest()
  expect(m.depths).toBe(squat.depths)
  for (const name of ['foot', 'shank', 'patella', 'thigh', 'trunk', 'arm'] as const) {
    expect(m.segments[name]).toHaveLength(squat.depths)
    for (const matrix of m.segments[name]) expect(matrix).toHaveLength(16)
  }
})

test('muscles stay out of bone and do not jump', () => {
  const { report } = manifest()
  expect(report).toHaveLength(13)
  expect(report.filter(r => r.maxPenetrationMm > 3)).toEqual([])
  expect(report.filter(r => r.maxJumpMm > 2 * Math.max(r.maxJumpNoPushMm, 1))).toEqual([])
})

test('the download stays within 4 MB', () => {
  expect(statSync(GLB).size + statSync(MANIFEST).size).toBeLessThanOrEqual(4e6)
})
