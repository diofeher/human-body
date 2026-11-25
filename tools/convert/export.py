# Run: Blender -b --factory-startup --disable-autoexec Startup.blend --python export.py -- <export-list.json> <out-dir> <ratio>
import bpy, json, sys, os

list_path, out_dir, ratio = sys.argv[sys.argv.index('--') + 1:]
ratio = float(ratio)
MIN_TRIANGLES = 200  # small shapes are never decimated

with open(list_path) as f:
    wanted = json.load(f)

def show_all(lc):
    lc.exclude = False
    lc.hide_viewport = False
    lc.collection.hide_viewport = False
    for child in lc.children:
        show_all(child)

show_all(bpy.context.view_layer.layer_collection)

# lighter geometry before evaluation: no subdivision, coarser tubes
for o in bpy.data.objects:
    for m in o.modifiers:
        if m.type == 'SUBSURF':
            m.levels = 0
for c in bpy.data.curves:
    if hasattr(c, 'bevel_resolution'):
        c.resolution_u = min(c.resolution_u, 4)
        c.bevel_resolution = 1

depsgraph = bpy.context.evaluated_depsgraph_get()
baked = {}
for item in wanted:
    source = bpy.data.objects[item['sourceName']]
    evaluated = source.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, depsgraph=depsgraph)
    matrix = evaluated.matrix_world.copy()
    mesh.transform(matrix)
    if matrix.determinant() < 0:
        mesh.flip_normals()
    mesh.materials.clear()
    if not mesh.polygons:
        raise SystemExit('empty geometry: ' + item['sourceName'])
    baked[item['id']] = mesh

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)

os.makedirs(out_dir, exist_ok=True)
for layer in sorted({i['layer'] for i in wanted}):
    scene = bpy.data.scenes.new(layer)
    bpy.context.window.scene = scene
    for item in (i for i in wanted if i['layer'] == layer):
        mesh = baked[item['id']]
        o = bpy.data.objects.new(item['id'], mesh)
        assert o.name == item['id'], o.name
        scene.collection.objects.link(o)
        triangles = sum(len(p.vertices) - 2 for p in mesh.polygons)
        if ratio < 1 and triangles > MIN_TRIANGLES:
            mod = o.modifiers.new('decimate', 'DECIMATE')
            mod.ratio = max(ratio, MIN_TRIANGLES / triangles)
            mod.use_collapse_triangulate = True
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(out_dir, layer + '.glb'), export_format='GLB',
        use_active_scene=True, export_apply=True, export_materials='NONE',
        export_normals=False, export_texcoords=False, export_animations=False,
        export_extras=False)
    print('exported', layer, len(scene.collection.objects))
    for o in list(scene.collection.objects):
        bpy.data.objects.remove(o)
