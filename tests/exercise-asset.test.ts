import { readFileSync, statSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import squat from '../src/exercises/squat.json'
import lunge from '../src/exercises/lunge.json'
import pushup from '../src/exercises/pushup.json'
import bridge from '../src/exercises/bridge.json'
import calfraise from '../src/exercises/calfraise.json'
import { muscleNode, type Exercise, type ExerciseManifest } from '../src/exercises/types'

const SEGMENTS = ['toes', 'foot', 'shank', 'patella', 'thigh', 'trunk', 'arm', 'ulna', 'radius', 'hand'] as const

describe.each([squat, lunge, pushup, bridge, calfraise] as Exercise[])('$id', exercise => {
  const GLB = `public/exercises/${exercise.asset ?? exercise.motion.type}.glb`
  const MANIFEST = `public/exercises/${exercise.asset ?? exercise.motion.type}.json`
  const manifest = (): ExerciseManifest => JSON.parse(readFileSync(MANIFEST, 'utf8'))
  const gltf = () => {
    const buf = readFileSync(GLB)
    return JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'))
  }
  const twoSided = exercise.motion.type === 'lunge'
  const pieces = exercise.groups.flatMap(group => group.pieces)
  const deforming = pieces.filter(p => p.kind !== 'trunk')

  test('every listed muscle is in the asset, with one shape per stored depth', () => {
    const g = gltf()
    for (const piece of pieces) {
      const names = [muscleNode(piece.name)]
      if (twoSided && piece.kind !== 'trunk') names.push(`left-${muscleNode(piece.name)}`)
      for (const name of names) {
        const node = g.nodes.find((n: any) => n.name === name)
        expect(node, name).toBeDefined()
        const targets = g.meshes[node.mesh].primitives[0].targets?.length ?? 0
        expect(targets, name).toBe(piece.kind === 'trunk' ? 0 : exercise.depths)
      }
    }
  })

  test('every bone segment has one matrix per stored depth', () => {
    const m = manifest()
    expect(m.depths).toBe(exercise.depths)
    expect(m.leftSegments !== undefined).toBe(twoSided)
    for (const frames of [m.segments, m.leftSegments ?? m.segments]) {
      for (const name of SEGMENTS) {
        expect(frames[name]).toHaveLength(exercise.depths)
        for (const matrix of frames[name]) expect(matrix).toHaveLength(16)
      }
    }
    for (const angle of m.angles) expect(angle.values).toHaveLength(exercise.depths)
  })

  test('muscles stay out of bone and do not jump', () => {
    const { report } = manifest()
    expect(report).toHaveLength(deforming.length * (twoSided ? 2 : 1))
    expect(report.filter(r => r.maxPenetrationMm > 3)).toEqual([])
    expect(report.filter(r => r.maxJumpMm > 2 * Math.max(r.maxJumpNoPushMm, 1))).toEqual([])
  })

  test('the download stays within 4 MB', () => {
    expect(statSync(GLB).size + statSync(MANIFEST).size).toBeLessThanOrEqual(4e6)
  })
})
