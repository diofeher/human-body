# Run: Blender -b --factory-startup --disable-autoexec <file>.blend --python inspect.py -- <out.json>
import bpy, json, sys

out = sys.argv[sys.argv.index('--') + 1]

# parent collection names, so each object lists its whole collection path
parents = {}
for c in bpy.data.collections:
    for child in c.children:
        parents.setdefault(child.name, c.name)

def chain(name):
    path = [name]
    while name in parents:
        name = parents[name]
        path.append(name)
    return list(reversed(path))

# hidden collections are not evaluated, so enable them all first
def show_all(lc):
    lc.exclude = False
    lc.hide_viewport = False
    lc.collection.hide_viewport = False
    for child in lc.children:
        show_all(child)

show_all(bpy.context.view_layer.layer_collection)
depsgraph = bpy.context.evaluated_depsgraph_get()

# triangle count after modifiers and curve bevels
def count_triangles(o):
    if o.type not in ('MESH', 'CURVE'):
        return 0
    me = bpy.data.meshes.new_from_object(o.evaluated_get(depsgraph), depsgraph=depsgraph)
    total = sum(max(len(p.vertices) - 2, 0) for p in me.polygons)
    bpy.data.meshes.remove(me)
    return total

items = []
for o in bpy.data.objects:
    cols = []
    for c in o.users_collection:
        cols += [n for n in chain(c.name) if n not in cols]
    items.append({'name': o.name, 'type': o.type, 'collections': cols, 'triangles': count_triangles(o),
                  'parent': o.parent.name if o.parent else None,
                  'modifiers': [m.type for m in o.modifiers]})

with open(out, 'w') as f:
    json.dump(items, f)
print('objects', len(items))
