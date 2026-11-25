export const LAYER_IDS = ['esqueleto', 'articulacoes', 'musculos', 'cardiovascular', 'nervoso', 'orgaos', 'linfatico'] as const
export type LayerId = (typeof LAYER_IDS)[number]

export interface Structure {
  id: string
  sourceName: string
  layer: LayerId
  namePt: string
  nameLatin: string | null
  side: 'esquerdo' | 'direito' | null
  translated: boolean
}
