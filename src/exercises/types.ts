export type PieceKind =
  | 'hipFemur' | 'vasti' | 'rectus' | 'hamstring' | 'bicepsShort' | 'gastroc' | 'soleus'
  | 'trunkArm' | 'tricepsLong' | 'tricepsShort' | 'trunk'

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
  /** pose settings read by the exporter */
  motion: { type: 'squat' | 'lunge' | 'pushup' | 'free' }
  /** name of the exported files, when it differs from the movement type */
  asset?: string
  /** bones the exporter keeps the muscles out of */
  solids: string[]
  /** target is in the GLB's Y-up space; the render fields are only for the exporter's check images */
  camera: { target: number[]; direction: number[]; distance: number }
  phases: Phase[]
  mistakes: { title: string; text: string }[]
  groups: MuscleGroup[]
}

export type Segment = 'toes' | 'foot' | 'shank' | 'patella' | 'thigh' | 'trunk' | 'arm' | 'ulna' | 'radius' | 'hand'
export type SegmentFrames = Record<Segment, number[][]>

/** written by tools/convert/exercise.py next to the GLB */
export interface ExerciseManifest {
  depths: number
  /** column-major 4x4 per stored depth, in the GLB's Y-up space */
  segments: SegmentFrames
  /** only for movements where the sides differ; frames for the mirrored left side */
  leftSegments?: SegmentFrames
  muscles: { node: string; group: string; name: string }[]
  /** joint angles shown on screen, one value per stored depth */
  angles: { label: string; values: number[] }[]
  report: { name: string; maxPenetrationMm: number; maxJumpMm: number; maxJumpNoPushMm: number }[]
}

export const muscleNode = (pieceName: string) => `muscle-${pieceName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
