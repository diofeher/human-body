import type { LayerId, Structure } from '../types.ts'

export const LAYER_LABELS: Record<LayerId, string> = {
  esqueleto: 'Esqueleto',
  articulacoes: 'Articulações',
  musculos: 'Músculos',
  cardiovascular: 'Sistema cardiovascular',
  nervoso: 'Sistema nervoso e sentidos',
  orgaos: 'Órgãos',
  linfatico: 'Sistema linfático',
}

export const LAYER_COLORS: Record<LayerId, string> = {
  esqueleto: '#e8dcc0',
  articulacoes: '#9fc5c9',
  musculos: '#b5483f',
  cardiovascular: '#d1263c',
  nervoso: '#e6c229',
  orgaos: '#c9806b',
  linfatico: '#5fa35a',
}

export const displayName = (s: Structure) => (s.side ? `${s.namePt} (${s.side})` : s.namePt)
