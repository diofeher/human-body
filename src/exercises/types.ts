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
