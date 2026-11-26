import type { Exercise } from './types.ts'

/** longest step one animation frame may take, so a background tab does not skip the movement */
const MAX_STEP = 0.1

export const duration = (ex: Exercise) => ex.phases.reduce((sum, p) => sum + p.seconds, 0)

export const wrapTime = (ex: Exercise, t: number) => ((t % duration(ex)) + duration(ex)) % duration(ex)

export const phaseStart = (ex: Exercise, index: number) =>
  ex.phases.slice(0, index).reduce((sum, p) => sum + p.seconds, 0)

export function phaseAt(ex: Exercise, t: number) {
  let local = wrapTime(ex, t)
  let index = 0
  while (index < ex.phases.length - 1 && local >= ex.phases[index].seconds) local -= ex.phases[index++].seconds
  return { index, phase: ex.phases[index], local }
}

/** 0 is standing, 1 is the deepest position */
export function depthAt(ex: Exercise, t: number) {
  const { phase, local } = phaseAt(ex, t)
  const eased = (1 - Math.cos(Math.PI * Math.min(local / phase.seconds, 1))) / 2
  return phase.from + (phase.to - phase.from) * eased
}

export function anglesAt(ex: Exercise, depth: number) {
  const { shank, thigh, trunk } = ex.maxAngles
  return {
    knee: Math.round((shank + thigh) * depth),
    hip: Math.round((trunk + thigh) * depth),
    ankle: Math.round(shank * depth),
  }
}

export function blend(depth: number, count: number) {
  const position = Math.min(Math.max(depth, 0), 1) * (count - 1)
  const a = Math.min(Math.floor(position), count - 2)
  return { a, b: a + 1, mix: position - a }
}

export const advance = (ex: Exercise, t: number, dtSeconds: number, speed: number) =>
  wrapTime(ex, t + Math.min(dtSeconds, MAX_STEP) * speed)
