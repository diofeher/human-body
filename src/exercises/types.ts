export type PieceKind = 'hipFemur' | 'vasti' | 'rectus' | 'hamstring' | 'bicepsShort' | 'gastroc' | 'soleus' | 'trunk'

export interface Phase { id: string; label: string; seconds: number; from: number; to: number; cues: string[] }
export interface MuscleGroup {
  id: string
  label: string
  role: 'principal' | 'apoio'
  note: string
  pieces: { name: string; kind: PieceKind }[]
}
export interface Exercise {
  id: string
  name: string
  reviewed: boolean
  depths: number
  maxAngles: { shank: number; thigh: number; trunk: number; arm: number }
  phases: Phase[]
  mistakes: { title: string; text: string }[]
  groups: MuscleGroup[]
}

export type Segment = 'foot' | 'shank' | 'patella' | 'thigh' | 'trunk' | 'arm'

/** written by tools/convert/exercise.py next to the GLB */
export interface ExerciseManifest {
  depths: number
  /** column-major 4x4 per stored depth, in the GLB's Y-up space */
  segments: Record<Segment, number[][]>
  muscles: { node: string; group: string; name: string }[]
  pivots: Record<'hip' | 'knee' | 'ankle', number[][]>
  report: { name: string; maxPenetrationMm: number; maxJumpMm: number; maxJumpNoPushMm: number }[]
}

export const muscleNode = (pieceName: string) => `muscle-${pieceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
