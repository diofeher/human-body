import { LAYER_IDS, type LayerId } from '../types.ts'

export interface LayerState { visible: boolean; opacity: number; status: 'idle' | 'loading' | 'ready' | 'error' }

export function createLayerStore(load: (id: LayerId) => Promise<void>) {
  const states = new Map<LayerId, LayerState>(LAYER_IDS.map(id => [id, { visible: false, opacity: 1, status: 'idle' }]))
  const pending = new Map<LayerId, Promise<void>>()
  const listeners = new Set<() => void>()

  const get = (id: LayerId): LayerState => states.get(id)!
  const update = (id: LayerId, patch: Partial<LayerState>) => {
    states.set(id, { ...get(id), ...patch })
    listeners.forEach(fn => fn())
  }

  function ensureLoaded(id: LayerId): Promise<void> {
    if (get(id).status === 'ready') return Promise.resolve()
    let request = pending.get(id)
    if (!request) {
      update(id, { status: 'loading' })
      request = load(id)
        .then(() => update(id, { status: 'ready' }), (error) => {
          console.warn(`Falha ao carregar a camada ${id}`, error)
          update(id, { status: 'error' })
        })
        .finally(() => pending.delete(id))
      pending.set(id, request)
    }
    return request
  }

  return {
    get,
    // visibility is recorded immediately, so a later toggle wins over a load in progress
    setVisible(id: LayerId, on: boolean): Promise<void> {
      update(id, { visible: on })
      return on ? ensureLoaded(id) : (pending.get(id) ?? Promise.resolve())
    },
    setOpacity(id: LayerId, opacity: number) {
      update(id, { opacity: Math.min(1, Math.max(0, opacity)) })
    },
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => { listeners.delete(fn) }
    },
  }
}
export type LayerStore = ReturnType<typeof createLayerStore>
