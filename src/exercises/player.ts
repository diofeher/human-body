import {
  BufferAttribute, BufferGeometry, Color, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh,
  MeshStandardMaterial, PerspectiveCamera, Scene, Vector3, WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { muscleNode, type Exercise, type ExerciseManifest, type Segment } from './types.ts'
import { blend, valueAt } from './timeline.ts'

export const ROLE_COLORS = { principal: '#e0523c', apoio: '#4f8fe0' } as const
const BONE_COLOR = '#e8dcc0'

/** xyz of an attribute as plain floats, whatever its storage (the asset is quantized) */
function floats(attribute: BufferGeometry['attributes'][string]) {
  const out = new Float32Array(attribute.count * 3)
  for (let i = 0; i < attribute.count; i++) out.set([attribute.getX(i), attribute.getY(i), attribute.getZ(i)], i * 3)
  return out
}

/** a muscle whose shape is blended on the CPU, so the lighting follows the bent surface */
function deformable(source: BufferGeometry) {
  const base = floats(source.attributes.position)
  const shapes = (source.morphAttributes.position ?? []).map(floats)
  const position = new BufferAttribute(base.slice(), 3)
  const geometry = new BufferGeometry().setAttribute('position', position)
  geometry.setIndex(source.index)
  return {
    geometry,
    /** the stored shapes are offsets from the standing mesh */
    set(a: number, b: number, mix: number) {
      const out = position.array as Float32Array
      for (let i = 0; i < out.length; i++) out[i] = base[i] + shapes[a][i] * (1 - mix) + shapes[b][i] * mix
      position.needsUpdate = true
      geometry.computeVertexNormals()
      geometry.computeBoundingSphere()
    },
  }
}

export async function createPlayer(container: HTMLElement, exercise: Exercise) {
  const url = (file: string) => `${import.meta.env.BASE_URL}exercises/${file}`
  const asset = exercise.motion.type
  const [manifest, gltf] = await Promise.all([
    fetch(url(`${asset}.json`)).then(async response => {
      if (!response.ok) throw new Error(`${asset}.json: ${response.status}`)
      return (await response.json()) as ExerciseManifest
    }),
    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url(`${asset}.glb`)),
  ])

  const material = (color: string) => new MeshStandardMaterial({ color: new Color(color), roughness: 0.75, side: DoubleSide })
  const materials = { bone: material(BONE_COLOR), principal: material(ROLE_COLORS.principal), apoio: material(ROLE_COLORS.apoio) }

  const found = new Map<string, Mesh>()
  gltf.scene.updateMatrixWorld(true)
  gltf.scene.traverse(node => { if (node instanceof Mesh) found.set(node.name, node) })

  const right = new Group()
  const left = new Group()
  left.scale.x = -1 // the movement is symmetrical, so the left side is the right side mirrored
  const midline = new Group()
  /** groups that move rigidly with one bone segment */
  const riders: { holder: Group; frames: number[][] }[] = []
  const shapes: ReturnType<typeof deformable>[] = []
  const support: Mesh[] = []
  let triangles = 0

  const leftFrames = manifest.leftSegments ?? manifest.segments

  function place(name: string, parents: Group[], look: MeshStandardMaterial, segment: Segment | null) {
    const source = found.get(name)
    if (!source) throw new Error(`missing node in ${asset}.glb: ${name}`)
    let geometry = source.geometry
    if (segment === null) {
      const shape = deformable(source.geometry)
      shapes.push(shape)
      geometry = shape.geometry
    } else geometry.computeVertexNormals()
    return parents.map(parent => {
      const mesh = new Mesh(geometry, look)
      // keeps the scale and offset that compression stores on the node
      source.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale)
      if (segment === null) parent.add(mesh)
      else {
        const holder = new Group()
        holder.matrixAutoUpdate = false
        holder.add(mesh)
        parent.add(holder)
        riders.push({ holder, frames: (parent === left ? leftFrames : manifest.segments)[segment] })
      }
      triangles += (geometry.index?.count ?? 0) / 3
      return mesh
    })
  }

  for (const segment of Object.keys(manifest.segments) as Segment[])
    if (found.has(`bone-${segment}`)) place(`bone-${segment}`, [right, left], materials.bone, segment)
  place('bone-midline', [midline], materials.bone, 'trunk')
  for (const group of exercise.groups) {
    for (const piece of group.pieces) {
      const node = muscleNode(piece.name)
      const look = materials[group.role]
      // two-sided movements ship a separate shape for each deforming left muscle
      const meshes = piece.kind === 'trunk'
        ? place(node, [right, left], look, 'trunk')
        : manifest.leftSegments
          ? [...place(node, [right], look, null), ...place(`left-${node}`, [left], look, null)]
          : place(node, [right, left], look, null)
      if (group.role === 'apoio') support.push(...meshes)
    }
  }

  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)
  // a corner readout, so the numbers never cover the joints and muscles
  const readout = document.createElement('dl')
  readout.className = 'angle-readout'
  const values = manifest.angles.map(({ label, values: stored }) => {
    const term = document.createElement('dt')
    term.textContent = label
    const element = document.createElement('dd')
    readout.append(term, element)
    return { stored, element }
  })
  container.appendChild(readout)

  const scene = new Scene()
  scene.add(right, left, midline, new HemisphereLight(0xffffff, 0x445066, 1.6))
  const camera = new PerspectiveCamera(35, 1, 0.01, 50)
  const light = new DirectionalLight(0xffffff, 1.4)
  light.position.set(1, 1.5, 2)
  camera.add(light)
  scene.add(camera)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.fromArray(exercise.camera.target)
  // front quarter view from the right side, where the angle labels are
  const homeDirection = new Vector3().fromArray(exercise.camera.direction).normalize()
  camera.position.copy(controls.target).addScaledVector(homeDirection, exercise.camera.distance)
  controls.update()

  let active = true
  let frame = 0
  function draw() {
    frame = 0
    renderer.render(scene, camera)
  }
  const render = () => { if (active && !frame) frame = requestAnimationFrame(draw) }
  controls.addEventListener('change', render)

  function setDepth(value: number) {
    for (const { stored, element } of values) element.textContent = `${valueAt(stored, value)}°`
    const { a, b, mix } = blend(value, manifest.depths)
    // element-wise blending matches the straight-line blending of the muscle shapes
    for (const { holder, frames } of riders) {
      const [from, to] = [frames[a], frames[b]]
      holder.matrix.fromArray(from.map((v, i) => v + (to[i] - v) * mix))
      holder.matrixWorldNeedsUpdate = true
    }
    for (const shape of shapes) shape.set(a, b, mix)
    render()
  }

  new ResizeObserver(() => {
    const { clientWidth: w, clientHeight: h } = container
    if (!w || !h) return
    renderer.setSize(w, h)
    camera.aspect = w / h
    // narrow views widen the field so the reaching arms stay inside
    camera.zoom = Math.min(1, camera.aspect / 0.75)
    camera.updateProjectionMatrix()
    render()
  }).observe(container)
  setDepth(0)

  return {
    setDepth,
    setSupportVisible(visible: boolean) {
      for (const mesh of support) mesh.visible = visible
      render()
    },
    setActive(value: boolean) {
      active = value
      if (!value && frame) { cancelAnimationFrame(frame); frame = 0 }
      render()
    },
    stats: () => ({ triangles }),
  }
}
export type Player = Awaited<ReturnType<typeof createPlayer>>
