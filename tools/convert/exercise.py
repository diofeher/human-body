# Poses the bones and deforms the muscles of one exercise, then writes an animated GLB and its manifest.
# Only the right side and the midline pieces are exported; the app mirrors the right side.
# Run: Blender -b --factory-startup --disable-autoexec Startup.blend --python exercise.py -- <repo> <out-dir> <id> [renders-dir]
import bpy, sys, os, re, json, math
import numpy as np
from mathutils import Vector, Matrix, kdtree
from mathutils.bvhtree import BVHTree

args = sys.argv[sys.argv.index('--') + 1:]
repo, out_dir = args[0], args[1]
ID = args[2]
renders = args[3] if len(args) > 3 else None
EX = json.load(open(os.path.join(repo, f'src/exercises/{ID}.json'), encoding='utf-8'))
MOTION = EX['motion']
STRUCTURES = json.load(open(os.path.join(repo, 'public/data/structures.json'), encoding='utf-8'))

DEPTHS = EX['depths']
STEPS_PER_DEPTH = 8
STEPS = (DEPTHS - 1) * STEPS_PER_DEPTH
BONE_RATIO, MUSCLE_RATIO = 0.4, 0.5
MARGIN = 0.0025

# Rest joint positions in atlas coordinates (metres, Z up, -Y forward), read from the
# rest pose of the 'Armature' object in Z-Biomechanics. See SOURCE.md.
HIP = np.array([-0.083, 0.004, 0.861])
KNEE = np.array([-0.081, 0.016, 0.455])
ANKLE = np.array([-0.076, 0.042, 0.072])
SHOULDER = np.array([-0.165, 0.022, 1.390])
ELBOW = np.array([-0.218, 0.032, 1.100])
WRIST = np.array([-0.262, -0.015, 0.855])
# the radius turns about the line from its head to the lower end of the ulna
RADIAL_HEAD = np.array([-0.240, 0.025, 1.092])
ULNAR_HEAD = np.array([-0.245, -0.011, 0.858])
BALL = np.array([-0.076, -0.072, 0.016])  # ball of the foot
ELBOW_BAND = (1.165, 1.075)
# heights used to hand a muscle over from one bone to the next
PATELLA_TOP, PATELLA_BOTTOM, TIBIA_TENDON = 0.465, 0.424, 0.392
KNEE_BAND = (0.505, 0.405)
ANKLE_BAND = (0.130, 0.060)

def show_all(lc):
    lc.exclude = False
    lc.hide_viewport = False
    lc.collection.hide_viewport = False
    for child in lc.children:
        show_all(child)

show_all(bpy.context.view_layer.layer_collection)
depsgraph = bpy.context.evaluated_depsgraph_get()

def bake(name):
    source = bpy.data.objects.get(name)
    if source is None:
        return None
    evaluated = source.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, depsgraph=depsgraph)
    matrix = evaluated.matrix_world.copy()
    mesh.transform(matrix)
    if matrix.determinant() < 0:
        mesh.flip_normals()
    mesh.materials.clear()
    return mesh

def required(name):
    mesh = bake(name)
    if mesh is None or not mesh.polygons:
        raise SystemExit('missing or empty: ' + name)
    return mesh

FOOT = r'talus|calcaneus|navicular|cuboid|cuneiform|metatarsal|phalanx.*foot|sesamoid bones of foot'
ARM = r'humerus|radius|ulna|scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate|metacarpal|phalanx.*hand'

def segment_of(name):
    base = re.sub(r'\.r$', '', name).lower()
    if re.search(FOOT, base): return 'toes' if 'phalanx' in base else 'foot'
    if base in ('tibia', 'fibula'): return 'shank'
    if base == 'patella': return 'patella'
    if base == 'femur': return 'thigh'
    if base == 'humerus': return 'arm'
    if base in ('ulna', 'radius'): return base
    if re.search(ARM, base): return 'hand'
    return 'trunk'

bone_names = [s['sourceName'] for s in STRUCTURES if s['layer'] == 'esqueleto' and not s['sourceName'].endswith('.l')]
bones = {n: required(n) for n in bone_names}

SOLID_NAMES = EX['solids']

pieces = []
for group in EX['groups']:
    for piece in group['pieces']:
        name = piece['name']
        short = name.replace(' muscle', '')
        patches = {key: bake(short + suffix) or bake(name + suffix) for key, suffix in (('o', '.or'), ('e', '.er'))}
        if piece['kind'] in ('vasti', 'rectus'):
            patches['e'] = required('Quadriceps femoris muscle.er')
        pieces.append({'name': name, 'kind': piece['kind'], 'group': group['id'], 'mesh': required(name + '.r'),
                       'patches': patches, 'node': 'muscle-' + re.sub(r'[^a-z0-9]+', '-', name.lower())})

def coords(mesh):
    return np.array([v.co for v in mesh.vertices], dtype=float)

SOLIDS = {n: {'co': coords(bones[n]), 'polys': [list(p.vertices) for p in bones[n].polygons], 'segment': segment_of(n)}
          for n in SOLID_NAMES}

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
scene = bpy.data.scenes.new('exercise')
bpy.context.window.scene = scene

def add(name, mesh):
    o = bpy.data.objects.new(name, mesh)
    assert o.name == name, o.name
    scene.collection.objects.link(o)
    return o

def decimated(name, mesh, ratio):
    o = add(name, mesh)
    triangles = sum(len(p.vertices) - 2 for p in mesh.polygons)
    if triangles > 200:
        mod = o.modifiers.new('decimate', 'DECIMATE')
        mod.ratio = max(ratio, 200 / triangles)
        mod.use_collapse_triangulate = True
        result = bpy.data.meshes.new_from_object(o.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        o.modifiers.clear()
        o.data = result
    return o

# ---- pose ----
def rot(degrees):
    t = math.radians(degrees)
    return np.array([[1, 0, 0], [0, math.cos(t), -math.sin(t)], [0, math.sin(t), math.cos(t)]])

def move(degrees, pivot, new_pivot):
    m = np.eye(4)
    m[:3, :3] = rot(degrees)
    m[:3, 3] = new_pivot - m[:3, :3] @ pivot
    return m

def apply(m, p):
    return p @ m[:3, :3].T + m[:3, 3]

def lerp(a, b, t):
    return a + (b - a) * t

def about(rotation, pivot, new_pivot):
    m = np.eye(4)
    m[:3, :3] = rotation
    m[:3, 3] = new_pivot - rotation @ pivot
    return m

def axis_rot(axis, degrees):
    return np.array(Matrix.Rotation(math.radians(degrees), 3, Vector(axis)))

def unit(v):
    return v / np.linalg.norm(v)

def frame(direction, hinge):
    a = unit(direction)
    b = unit(hinge - a * np.dot(a, hinge))
    return np.stack([a, b, np.cross(a, b)], 1)

def angle_between(a, b):
    return math.degrees(math.acos(np.clip(np.dot(unit(a), unit(b)), -1, 1)))

# turn about the radius axis that brings the palm from facing forward to facing backward
def pronation(degrees):
    return about(axis_rot(ULNAR_HEAD - RADIAL_HEAD, degrees), RADIAL_HEAD, RADIAL_HEAD)

def straight_arm(upper, degrees_pronated):
    """the whole arm as one piece, with the forearm turned by degrees_pronated"""
    turned = upper @ pronation(degrees_pronated)
    return {'arm': upper, 'ulna': upper, 'radius': turned, 'hand': turned}

def squat_pose(depth):
    a = MOTION
    shank, thigh, trunk, arm = a['shank'] * depth, -a['thigh'] * depth, a['trunk'] * depth, -a['arm'] * depth
    t_shank = move(shank, ANKLE, ANKLE)
    knee = apply(t_shank, KNEE)
    t_thigh = move(thigh, KNEE, knee)
    hip = apply(t_thigh, HIP)
    t_trunk = move(trunk, HIP, hip)
    shoulder = apply(t_trunk, SHOULDER)
    matrices = {'foot': np.eye(4), 'toes': np.eye(4), 'shank': t_shank, 'thigh': t_thigh, 'trunk': t_trunk,
                'patella': t_thigh @ move(-(thigh - shank) * 0.7, KNEE, KNEE),
                **straight_arm(move(arm, SHOULDER, shoulder), a['pronation'] * depth)}
    angles = {'Quadril': trunk - thigh, 'Joelho': shank - thigh, 'Tornozelo': shank}
    return {'r': matrices}, np.eye(4), angles

def plane_angle(v):
    """angle of a vector in the side (y, z) plane"""
    return math.degrees(math.atan2(v[2], v[1]))

def leg_to(hip, ankle):
    """thigh and shank turns that join a hip and an ankle position, knee pointing forward"""
    thigh, shank = HIP - KNEE, KNEE - ANKLE
    a, b = np.hypot(*thigh[1:]), np.hypot(*shank[1:])
    line = hip - ankle
    d = min(np.hypot(*line[1:]), a + b - 1e-5)
    bend = math.degrees(math.acos(np.clip((b * b + d * d - a * a) / (2 * b * d), -1, 1)))
    shank_turn = plane_angle(line) + bend - plane_angle(shank)
    t_shank = move(shank_turn, ANKLE, ankle)
    knee = apply(t_shank, KNEE)
    thigh_turn = plane_angle(hip - knee) - plane_angle(thigh)
    return shank_turn, thigh_turn, t_shank, move(thigh_turn, KNEE, knee)

def lunge_pose(p):
    """p from -1 (atlas rest) through 0 (top of the movement) to 1 (bottom)"""
    top, bottom = MOTION['top'], MOTION['bottom']
    into, depth = min(p + 1, 1), max(p, 0)
    value = lambda key, rest: lerp(rest, lerp(top[key], bottom[key], depth), into)
    trunk = value('trunk', 0)
    hip = np.array([HIP[0], value('hipY', HIP[1]), value('hipZ', HIP[2])])
    t_trunk = move(trunk, HIP, hip)
    arms = straight_arm(move(0, SHOULDER, apply(t_trunk, SHOULDER)), 0)
    sides, legs = {}, {}
    for side, leg in (('r', 'front'), ('l', 'back')):
        # the ball of each foot has a fixed place; the heel rises by turning about it
        ball = np.array([BALL[0], lerp(BALL[1], MOTION[leg + 'BallY'], into), BALL[2]])
        heel = value(leg + 'Heel', 0)
        t_foot = move(heel, BALL, ball)
        shank, thigh, t_shank, t_thigh = leg_to(hip, apply(t_foot, ANKLE))
        sides[side] = {'foot': t_foot, 'toes': move(0, BALL, ball), 'shank': t_shank, 'thigh': t_thigh,
                       'patella': t_thigh @ move(-(thigh - shank) * 0.7, KNEE, KNEE), 'trunk': t_trunk, **arms}
        legs[leg] = {'knee': shank - thigh, 'hip': trunk - thigh}
    angles = {'Joelho da frente': legs['front']['knee'], 'Joelho de trás': legs['back']['knee'],
              'Quadril da frente': legs['front']['hip']}
    return sides, np.eye(4), angles

def reach_arm(shoulder, wrist, to_body):
    """arm joined from the shoulder to a wrist target, both in the body's own (standing) frame"""
    upper, lower = np.linalg.norm(ELBOW - SHOULDER), np.linalg.norm(WRIST - ELBOW)
    line = wrist - shoulder
    d = min(np.linalg.norm(line), upper + lower - 1e-4)
    along = (upper * upper + d * d - lower * lower) / (2 * d)
    pole = to_body @ np.array(MOTION['elbowPoint'], float)
    out = unit(pole - unit(line) * np.dot(unit(line), pole))
    elbow = shoulder + unit(line) * along + out * math.sqrt(max(upper * upper - along * along, 0))
    wrist = shoulder + unit(line) * d
    hinge = np.cross(elbow - shoulder, wrist - elbow)
    rest_hinge = np.cross(ELBOW - SHOULDER, np.array([0.0, -1, 0]))
    r_upper = frame(elbow - shoulder, hinge) @ frame(ELBOW - SHOULDER, rest_hinge).T
    r_lower = frame(wrist - elbow, hinge) @ frame(WRIST - ELBOW, rest_hinge).T
    return r_upper, r_lower, shoulder, elbow, wrist

def pushup_wrist():
    """the hands' place on the floor, under the shoulders at the top"""
    body = move(90 - MOTION['topRise'], BALL, BALL)
    shoulder = apply(body, SHOULDER)
    return np.array([MOTION['handX'], shoulder[1] + MOTION['handY'], MOTION['wristZ']])

def pushup_pose(p):
    """Muscles are solved in the body's own frame; `world` then lays the straight body down."""
    into, depth = min(p + 1, 1), max(p, 0)
    rise = lerp(MOTION['topRise'], MOTION['bottomRise'], depth)
    world = move(90 - rise, BALL, BALL)
    inverse = np.linalg.inv(world)
    r_upper, r_lower, shoulder, elbow, wrist = reach_arm(SHOULDER, apply(inverse, pushup_wrist()), inverse[:3, :3])
    angles = {'Cotovelo': angle_between(elbow - shoulder, wrist - elbow),
              'Ombro': angle_between(elbow - shoulder, np.array([0.0, 0, -1]))}
    # palm down, fingers toward the head; the atlas hand already tilts 25 degrees forward
    flat = axis_rot((0, 1, 0), 180) @ rot(-90) @ rot(25)
    r_hand = inverse[:3, :3] @ flat
    t_upper = about(r_upper, SHOULDER, SHOULDER)
    t_lower = about(r_lower, ELBOW, elbow)
    # the turn of the radius that brings the palm closest to the floor
    def palm_error(degrees):
        palm = r_lower @ pronation(degrees)[:3, :3] @ np.array([0.0, -1, 0])
        return angle_between(palm, r_hand @ np.array([0.0, -1, 0]))
    turn = min(range(-180, 181), key=palm_error)
    if into < 1:  # swing from the hanging arm to the top position
        def part(r):
            q = Matrix(r.tolist()).to_quaternion()
            return np.array(Matrix.Identity(3).to_quaternion().slerp(q, into).to_matrix())
        t_upper = about(part(r_upper), SHOULDER, SHOULDER)
        elbow = apply(t_upper, ELBOW)
        t_lower = about(part(r_lower), ELBOW, elbow)
        r_hand = part(r_hand)
        turn *= into
    t_radius = t_lower @ pronation(turn)
    t_hand = about(r_hand, WRIST, apply(t_radius, WRIST))
    body = {k: np.eye(4) for k in ('foot', 'shank', 'patella', 'thigh', 'trunk')}
    toes = inverse @ move(0, BALL, BALL)  # toes stay flat on the floor
    return {'r': {**body, 'toes': lerp(np.eye(4), toes, into), 'arm': t_upper, 'ulna': t_lower,
                  'radius': t_radius, 'hand': t_hand}}, world, angles

pose = {'squat': squat_pose, 'lunge': lunge_pose, 'pushup': pushup_pose}[MOTION['type']]
# the squat starts at the atlas rest pose; the others first travel from it to their starting position
START = 0 if MOTION['type'] == 'squat' else -1
SIDES = list(pose(0)[0])
PRE = -START * STEPS

# ---- weights ----
def smooth01(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)

def attachment_field(piece, points, edges, degree):
    """0 at the origin patch, 1 at the insertion patch, smooth in between"""
    fixed = np.full(len(points), -1.0)
    for key, value in (('o', 0.0), ('e', 1.0)):
        patch = piece['patches'][key]
        selected = None
        if patch is not None:
            kd = kdtree.KDTree(len(patch.vertices))
            for i, v in enumerate(patch.vertices):
                kd.insert(v.co, i)
            kd.balance()
            d = np.array([kd.find(Vector(p))[2] for p in points])
            limit = max(0.006, np.percentile(d, 2)) if d.min() < 0.012 else d.min() + 0.006
            selected = d < limit
        if selected is None or not selected.any():
            z = points[:, 2]
            selected = z > np.percentile(z, 92) if value == 0 else z < np.percentile(z, 8)
            print('NOTE', piece['name'], key, 'patch missing, using height')
        fixed[selected] = value
    u = np.where(fixed < 0, 0.5, fixed)
    for _ in range(4000):
        total = np.bincount(edges[:, 0], u[edges[:, 1]], len(u)) + np.bincount(edges[:, 1], u[edges[:, 0]], len(u))
        u = np.where(fixed < 0, np.where(degree > 0, total / np.maximum(degree, 1), u), fixed)
    return u

def neighbours(values, edges):
    total = np.zeros_like(values)
    np.add.at(total, edges[:, 0], values[edges[:, 1]])
    np.add.at(total, edges[:, 1], values[edges[:, 0]])
    return total

def weights_for(piece, points, edges, degree):
    kind, z = piece['kind'], points[:, 2]
    below = lambda band: smooth01((band[0] - z) / (band[0] - band[1]))
    if kind in ('hipFemur', 'rectus', 'hamstring', 'trunkArm', 'tricepsLong'):
        u = attachment_field(piece, points, edges, degree)
    if kind == 'trunkArm':
        a = smooth01(u)
        w = {'trunk': 1 - a, 'arm': a}
    elif kind in ('tricepsLong', 'tricepsShort'):
        top = smooth01(1 - u / 0.3) if kind == 'tricepsLong' else np.zeros(len(z))
        low = below(ELBOW_BAND)
        w = {'trunk': top, 'arm': (1 - top) * (1 - low), 'ulna': (1 - top) * low}
    elif kind == 'hipFemur':
        a = smooth01(u)
        w = {'trunk': 1 - a, 'thigh': a}
    elif kind in ('vasti', 'rectus'):
        top = smooth01(1 - u / 0.3) if kind == 'rectus' else np.zeros(len(z))
        near = smooth01((0.515 - z) / (0.515 - PATELLA_TOP))
        under = below((PATELLA_BOTTOM, TIBIA_TENDON))
        w = {'trunk': top, 'thigh': (1 - top) * (1 - near), 'patella': (1 - top) * near * (1 - under),
             'shank': (1 - top) * near * under}
    elif kind == 'hamstring':
        top, low = smooth01(1 - u / 0.3), below(KNEE_BAND)
        w = {'trunk': top, 'thigh': (1 - top) * (1 - low), 'shank': (1 - top) * low}
    elif kind == 'bicepsShort':
        low = below(KNEE_BAND)
        w = {'thigh': 1 - low, 'shank': low}
    elif kind == 'gastroc':
        low, foot = below(KNEE_BAND), below(ANKLE_BAND)
        w = {'thigh': 1 - low, 'shank': low * (1 - foot), 'foot': low * foot}
    elif kind == 'soleus':
        foot = below(ANKLE_BAND)
        w = {'shank': 1 - foot, 'foot': foot}
    else:
        raise SystemExit('unknown kind ' + kind)
    W = np.stack(list(w.values()), 1)
    for _ in range(25):
        W = 0.5 * W + 0.5 * neighbours(W, edges) / np.maximum(degree, 1)[:, None]
    W /= W.sum(1, keepdims=True)
    return {name: W[:, i] for i, name in enumerate(w)}

# ---- collision with bone ----
def tree(points, polys):
    return BVHTree.FromPolygons([Vector(p) for p in points], polys)

def signed_distance(t, points, reach=0.03):
    distance = np.full(len(points), reach)
    near = [None] * len(points)
    for i, p in enumerate(points):
        location, normal, _, d = t.find_nearest(Vector(p), reach)
        if location is not None:
            distance[i] = math.copysign(d, (Vector(p) - location).dot(normal))
            near[i] = (location, normal)
    return distance, near

def posed_trees(matrices):
    return {n: tree(apply(matrices[s['segment']], s['co']), s['polys']) for n, s in SOLIDS.items()}

def push_out(muscle, points, trees, start):
    """moves vertices that went deeper into bone than at rest back out, spreading the correction"""
    edges, degree = muscle['edges'], np.maximum(muscle['degree'], 1)[:, None]

    def push(x):
        x = x.copy()
        hit = np.zeros(len(x), bool)
        for name, t in trees.items():
            distance, near = signed_distance(t, x)
            need = np.minimum(muscle['rest_distance'][name], MARGIN)
            for i in np.nonzero(distance < need - 1e-4)[0]:
                location, normal = near[i]
                x[i] = np.array(location + normal * float(need[i]))
                hit[i] = True
        return x, hit

    correction = start.copy()
    for _ in range(12):
        x, hit = push(points + correction)
        correction = x - points
        if not hit.any():
            break
        for _ in range(4):
            correction = np.where(hit[:, None], correction,
                                  0.2 * correction + 0.8 * neighbours(correction, edges) / degree)
    return push(points + correction)[0]

# ---- muscles ----
rest_trees = posed_trees({s: np.eye(4) for s in {x['segment'] for x in SOLIDS.values()}})
moving = []
for piece in pieces:
    o = decimated(piece['node'], piece['mesh'], MUSCLE_RATIO)
    piece['object'] = o
    if piece['kind'] == 'trunk':
        continue
    points = coords(o.data)
    edges = np.array([e.vertices for e in o.data.edges])
    degree = np.bincount(edges.ravel(), minlength=len(points))
    shared = dict(piece=piece, name=piece['name'], rest=points, edges=edges, degree=degree,
                  weights=weights_for(piece, points, edges, degree),
                  rest_distance={n: signed_distance(t, points)[0] for n, t in rest_trees.items()})
    # a two-sided movement solves the left muscle as a right one and mirrors it in the app
    for side in SIDES:
        node = piece['node'] if side == 'r' else 'left-' + piece['node']
        target = o
        if side != 'r':
            target = add(node, o.data.copy())
        mod = target.modifiers.new('cs', 'CORRECTIVE_SMOOTH')
        mod.iterations, mod.factor, mod.rest_source = 15, 0.6, 'BIND'
        moving.append({**shared, 'side': side, 'node': node, 'object': target, 'smooth': [], 'correction': []})

bpy.context.view_layer.update()
for muscle in moving:
    bpy.context.view_layer.objects.active = muscle['object']
    bpy.ops.object.correctivesmooth_bind(modifier='cs')

def put(o, points):
    o.data.vertices.foreach_set('co', np.asarray(points, np.float32).ravel())
    o.data.update()

# small steps, each starting from the previous correction, so vertices stay on one side of a bone
for step in range(PRE + STEPS + 1):
    sides = pose(START + step / STEPS)[0]
    trees = {side: posed_trees(m) for side, m in sides.items()}
    for muscle in moving:
        put(muscle['object'], sum(w[:, None] * apply(sides[muscle['side']][s], muscle['rest'])
                                  for s, w in muscle['weights'].items()))
    graph = bpy.context.evaluated_depsgraph_get()
    for muscle in moving:
        smoothed = coords(muscle['object'].evaluated_get(graph).data) if step else muscle['rest']
        previous = muscle['correction'][-1] if step else np.zeros_like(smoothed)
        pushed = push_out(muscle, smoothed, trees[muscle['side']], previous) if step else smoothed
        muscle['smooth'].append(smoothed)
        muscle['correction'].append(pushed - smoothed)
    if step % 20 == 0:
        print('STEP', step, 'of', PRE + STEPS, flush=True)

RADIUS, SIGMA = 16, 6.0
kernel = np.exp(-0.5 * (np.arange(-RADIUS, RADIUS + 1) / SIGMA) ** 2)
kernel /= kernel.sum()

def max_jump(frames):
    second = frames[2:] - 2 * frames[1:-1] + frames[:-2]
    return float(np.linalg.norm(second, axis=2).max() * 1000)

stored = [pose(i / (DEPTHS - 1)) for i in range(DEPTHS)]
stored_trees = [{side: posed_trees(m) for side, m in entry[0].items()} for entry in stored]
report = []
for muscle in moving:
    smooth = np.stack(muscle['smooth'])
    correction = np.stack(muscle['correction'])
    padded = np.concatenate([correction[:1]] * RADIUS + [correction] + [correction[-1:]] * RADIUS)
    blurred = np.stack([np.tensordot(kernel, padded[i:i + 2 * RADIUS + 1], 1) for i in range(len(correction))])
    blurred[0] = 0  # the first shape is the atlas mesh itself
    final = (smooth + blurred)[PRE::STEPS_PER_DEPTH]
    worst = 0.0
    for i in range(DEPTHS):
        for name, t in stored_trees[i][muscle['side']].items():
            distance, _ = signed_distance(t, final[i])
            worst = max(worst, float((np.minimum(muscle['rest_distance'][name], 0) - distance).max()))
    unpushed = smooth[PRE::STEPS_PER_DEPTH]
    # from the body's own frame to the room
    muscle['final'] = np.stack([apply(stored[i][1], final[i]) for i in range(DEPTHS)])
    row = {'name': muscle['name'] + ('' if muscle['side'] == 'r' else ' (outro lado)'),
           'maxPenetrationMm': round(worst * 1000, 1), 'maxJumpMm': round(max_jump(final), 1),
           'maxJumpNoPushMm': round(max_jump(unpushed), 1)}
    report.append(row)
    print('REPORT', json.dumps(row))

# ---- bones: one mesh per segment ----
def merged(name, meshes):
    import bmesh
    bm = bmesh.new()
    for m in meshes:
        bm.from_mesh(m)
    result = bpy.data.meshes.new(name)
    bm.to_mesh(result)
    bm.free()
    return result

grouped = {}
for name, mesh in bones.items():
    key = 'bone-' + (segment_of(name) if name.endswith('.r') else 'midline')
    if not name.endswith('.r'):
        assert segment_of(name) == 'trunk', name
    small = decimated('tmp', mesh, BONE_RATIO)
    grouped.setdefault(key, []).append(small.data)
    bpy.data.objects.remove(small)
bone_objects = {key: add(key, merged(key, meshes)) for key, meshes in grouped.items()}

def segment_of_node(key):
    return 'trunk' if key == 'bone-midline' else key.split('-', 1)[1]

# ---- optional check renders ----
if renders:
    os.makedirs(renders, exist_ok=True)
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.use_freestyle = False
    scene.view_settings.view_transform = 'Standard'
    shading = scene.display.shading
    shading.light, shading.color_type, shading.show_cavity = 'STUDIO', 'OBJECT', True
    scene.render.resolution_x, scene.render.resolution_y = 500, 760
    camera = bpy.data.cameras.new('c')
    camera.type, camera.ortho_scale = 'ORTHO', EX['camera']['renderScale']
    scene.render.resolution_x, scene.render.resolution_y = 700, 700
    cam = add('camera', camera)
    scene.camera = cam
    x, up, back = EX['camera']['target']  # stored in the browser's Y-up space
    target = Vector((x, -back, up))
    rest_bones = {k: coords(o.data) for k, o in bone_objects.items()}
    for o in bone_objects.values():
        o.color = (0.85, 0.82, 0.72, 1)
    mirror = np.array([-1.0, 1, 1])
    copies = {}
    def duplicate(key, source, flip):
        mesh = source.data.copy()
        o = add('copy-' + key, mesh)
        if flip:
            mesh.flip_normals()
        o.color = source.color
        copies[key] = o
        return o
    for key, o in bone_objects.items():
        if key != 'bone-midline':
            duplicate(key, o, True)
    shades = [(0.75, 0.12, 0.1, 1), (0.95, 0.45, 0.2, 1), (0.6, 0.1, 0.4, 1), (0.2, 0.4, 0.8, 1)]
    for muscle in moving:
        muscle['object'].modifiers.clear()
    for piece in pieces:
        piece['trunk_rest'] = coords(piece['object'].data)
        duplicate(piece['node'], piece['object'], True)
    for i, depth_index in enumerate((0, (DEPTHS - 1) // 2, DEPTHS - 1)):
        sides, world, _ = stored[depth_index]
        other = sides.get('l', sides['r'])
        for key, o in bone_objects.items():
            segment = segment_of_node(key)
            put(o, apply(world @ sides['r'][segment], rest_bones[key]))
            if key != 'bone-midline':
                put(copies[key], apply(world @ other[segment], rest_bones[key]) * mirror)
        for piece in pieces:
            if piece['kind'] == 'trunk':
                points = apply(world @ sides['r']['trunk'], piece['trunk_rest'])
                put(piece['object'], points)
                put(copies[piece['node']], points * mirror)
        for muscle in moving:
            if muscle['side'] == 'r':
                put(muscle['object'], muscle['final'][depth_index])
            if muscle['side'] == SIDES[-1]:
                put(copies[muscle['piece']['node']], muscle['final'][depth_index] * mirror)
        for muscle in moving:
            if muscle['side'] != 'r':
                muscle['object'].hide_render = True
        for group_index, group in enumerate(EX['groups']):
            members = [p for p in pieces if p['group'] == group['id']]
            for piece in pieces:
                for o in (piece['object'], copies[piece['node']]):
                    o.hide_render = piece['group'] != group['id']
            for n, piece in enumerate(members):
                for o in (piece['object'], copies[piece['node']]):
                    o.color = shades[n % len(shades)]
            for view, direction in EX['camera']['renderViews'].items():
                d = Vector(direction).normalized()
                cam.location = target + d * 4
                cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
                scene.render.filepath = os.path.join(renders, f"{group['id']}-{view}-{i}.png")
                bpy.ops.render.render(write_still=True)
    # put everything back at rest before exporting
    for key, o in bone_objects.items():
        put(o, rest_bones[key])
    for piece in pieces:
        put(piece['object'], piece['trunk_rest'])
    for o in list(copies.values()) + [cam]:
        bpy.data.objects.remove(o)

# ---- export ----
for muscle in moving:
    o = muscle['object']
    o.hide_render = False
    o.modifiers.clear()
    put(o, muscle['rest'])
    o.shape_key_add(name='Basis', from_mix=False)
    for i in range(DEPTHS):
        key = o.shape_key_add(name=str(i), from_mix=False)
        key.data.foreach_set('co', np.asarray(muscle['final'][i], np.float32).ravel())

os.makedirs(out_dir, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(out_dir, ID + '.glb'), export_format='GLB', use_active_scene=True,
    export_materials='NONE', export_normals=False, export_texcoords=False, export_animations=False,
    export_extras=False, export_morph=True, export_morph_normal=False)

# the exporter turns Z-up into Y-up: (x, y, z) -> (x, z, -y)
UP = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, -1, 0, 0], [0, 0, 0, 1]], float)

def segment_frames(side):
    return {name: [[round(float(v), 6) for v in (UP @ world @ sides[side][name] @ np.linalg.inv(UP)).T.ravel()]
                   for sides, world, _ in stored] for name in stored[0][0][side]}

manifest = {'depths': DEPTHS, 'segments': segment_frames('r'), 'report': report,
            'angles': [{'label': label, 'values': [round(abs(entry[2][label])) for entry in stored]}
                       for label in stored[0][2]],
            'muscles': [{'node': p['node'], 'group': p['group'], 'name': p['name']} for p in pieces]}
if 'l' in SIDES:
    manifest['leftSegments'] = segment_frames('l')
with open(os.path.join(out_dir, ID + '.json'), 'w') as f:
    json.dump(manifest, f, separators=(',', ':'))
print('DONE')
