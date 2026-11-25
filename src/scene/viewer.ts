import {
  Box3, Color, DirectionalLight, DoubleSide, HemisphereLight, Mesh, MeshStandardMaterial,
  PerspectiveCamera, Raycaster, Scene, Sphere, Vector2, Vector3, WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { LAYER_IDS, type LayerId } from '../types.ts'
import type { LayerStore } from '../state/layers.ts'
import { LAYER_COLORS } from '../ui/labels.ts'
import { loadLayer } from './loader.ts'
import { isClick, pickable } from './picking.ts'
import { isShown, layerWasTurnedOn } from './visibility.ts'

export function createViewer(container: HTMLElement, onProgress: (layer: LayerId, fraction: number) => void) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const scene = new Scene()
  const camera = new PerspectiveCamera(35, 1, 0.01, 50)
  const controls = new OrbitControls(camera, renderer.domElement)
  scene.add(new HemisphereLight(0xffffff, 0x445066, 1.6))
  const light = new DirectionalLight(0xffffff, 1.4)
  light.position.set(1, 1.5, 2)
  camera.add(light)
  scene.add(camera)

  const material = (color: string, emissive = '#000000') =>
    new MeshStandardMaterial({ color: new Color(color), emissive: new Color(emissive), roughness: 0.75, side: DoubleSide })
  const layerMaterials = new Map(LAYER_IDS.map(id => [id, material(LAYER_COLORS[id])]))
  const hoverMaterial = material('#7fd4ff', '#10475e')
  const selectedMaterial = material('#21b4ff', '#0b5f8a')

  const meshes = new Map<string, Mesh>()
  const layerOf = new Map<string, LayerId>()
  const hidden = new Set<string>()
  const listeners = new Set<(id: string | null) => void>()
  let store: LayerStore | null = null
  let isolated: string | null = null
  let selected: string | null = null
  let hovered: string | null = null

  // render only when something changes
  let frame = 0
  const render = () => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; renderer.render(scene, camera) })
  }
  controls.addEventListener('change', render)

  const shown = (id: string) => isShown(id, store!.get(layerOf.get(id)!), hidden, isolated)

  function refresh() {
    if (!store) return
    for (const [id, m] of layerMaterials) {
      const { opacity } = store.get(id)
      const transparent = opacity < 1
      if (m.transparent !== transparent) m.needsUpdate = true
      Object.assign(m, { opacity, transparent, depthWrite: !transparent })
    }
    for (const [id, mesh] of meshes) {
      mesh.visible = shown(id)
      mesh.material = id === selected ? selectedMaterial : id === hovered ? hoverMaterial : layerMaterials.get(layerOf.get(id)!)!
    }
    render()
  }

  function select(id: string | null) {
    if (id === selected) return
    selected = id
    refresh()
    listeners.forEach(fn => fn(id))
  }

  const home = { position: new Vector3(0, 0.95, 4), target: new Vector3(0, 0.9, 0) }
  function resetCamera() {
    camera.position.copy(home.position)
    controls.target.copy(home.target)
    controls.update()
    render()
  }

  const raycaster = new Raycaster()
  const pointer = new Vector2()
  function pick(event: PointerEvent): string | null {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(pointer, camera)
    const candidates = [...meshes.values()].filter(m => m.visible)
    return pickable(raycaster.intersectObjects(candidates, false).map(h => ({ id: h.object.name, visible: h.object.visible })))
  }

  let down: { x: number; y: number } | null = null
  let lastMove: PointerEvent | null = null
  const canvas = renderer.domElement
  canvas.addEventListener('pointerdown', e => { down = e.button === 0 ? { x: e.clientX, y: e.clientY } : null })
  canvas.addEventListener('pointerup', e => {
    if (down && isClick(down, { x: e.clientX, y: e.clientY })) select(pick(e))
    down = null
  })
  canvas.addEventListener('pointermove', e => {
    if (down || e.pointerType !== 'mouse') return
    const queued = lastMove !== null
    lastMove = e
    if (queued) return
    requestAnimationFrame(() => {
      const id = lastMove ? pick(lastMove) : null
      lastMove = null
      if (id !== hovered) {
        hovered = id
        canvas.style.cursor = id ? 'pointer' : 'grab'
        refresh()
      }
    })
  })
  canvas.addEventListener('pointerleave', () => { lastMove = null; hovered = null; refresh() })

  new ResizeObserver(() => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    render()
  }).observe(container)
  resetCamera()

  return {
    async load(layer: LayerId) {
      const { root, meshes: loaded } = await loadLayer(layer, f => onProgress(layer, f))
      for (const [id, mesh] of loaded) {
        meshes.set(id, mesh)
        layerOf.set(id, layer)
      }
      scene.add(root)
      refresh()
    },
    attach(layers: LayerStore) {
      store = layers
      const visibleLayers = () => new Set<string>(LAYER_IDS.filter(id => layers.get(id).visible))
      let before = visibleLayers()
      layers.subscribe(() => {
        const after = visibleLayers()
        // asking for another layer means leaving isolation, or nothing would appear
        if (layerWasTurnedOn(before, after)) isolated = null
        before = after
        refresh()
        // a selection in a layer the person switched off is dropped
        if (selected && meshes.has(selected) && !shown(selected)) select(null)
      })
    },
    select,
    isolate(id: string) {
      isolated = id
      hidden.delete(id)
      refresh()
    },
    hide(id: string) {
      hidden.add(id)
      if (isolated === id) isolated = null
      if (selected === id) select(null)
      refresh()
    },
    /** makes one structure visible again, leaving isolation if it is another one */
    reveal(id: string) {
      hidden.delete(id)
      if (isolated !== id) isolated = null
      refresh()
    },
    focus(id: string) {
      const mesh = meshes.get(id)
      if (!mesh) return
      const sphere = new Box3().setFromObject(mesh).getBoundingSphere(new Sphere())
      const distance = Math.max(sphere.radius / Math.sin((camera.fov * Math.PI) / 360), 0.25) * 1.6
      const direction = camera.position.clone().sub(controls.target).normalize()
      controls.target.copy(sphere.center)
      camera.position.copy(sphere.center).addScaledVector(direction, distance)
      controls.update()
      render()
    },
    reset() {
      isolated = null
      hidden.clear()
      select(null)
      refresh()
      resetCamera()
    },
    onSelect(fn: (id: string | null) => void) {
      listeners.add(fn)
    },
  }
}
export type Viewer = ReturnType<typeof createViewer>
