import { Group, Mesh } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import type { LayerId } from '../types.ts'

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)

export async function loadLayer(layer: LayerId, onProgress: (fraction: number) => void): Promise<{ root: Group; meshes: Map<string, Mesh> }> {
  const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/${layer}.glb`, e => {
    if (e.total) onProgress(e.loaded / e.total)
  })
  const meshes = new Map<string, Mesh>()
  gltf.scene.traverse(node => {
    if (node instanceof Mesh) {
      node.geometry.computeVertexNormals()
      meshes.set(node.name, node)
    }
  })
  return { root: gltf.scene, meshes }
}
