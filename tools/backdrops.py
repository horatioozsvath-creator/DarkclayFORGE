"""The counter view's painted backdrops: the shop front built in Blender from the shop's own models, lit warm, rendered from behind
the counter for each view (the counter facing the door, the left wall, the right wall, turned round to the workshop doorway) at two
shapes (wide, and a phone held upright), with what the page lays over them written beside:

  assets/backdrops/<view>_<shape>.webp       the room, the shelves empty
  assets/backdrops/<view>_<shape>_fg.webp    the counter alone (its cut-out: it stands in front of the customers), where it's in view
  assets/backdrops/backdrops.json            each picture's size; the card places' four corners (in pixels), the customers'
                                             standing spots (a foot's pixel and pixels per metre there), the hotspots

Run with Blender (headless), from the repository:
  blender -b -P tools/backdrops.py -- [views...]
Then bump BACKDROPS_V in js/counter.js so browsers fetch the new pictures.
"""
import bpy, bmesh, json, math, os, sys
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, 'assets/models')
OUT = os.path.join(ROOT, 'assets/backdrops')
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
palette = json.load(open(os.path.join(MODELS, 'palette.json')))['slots']

def lin(h):
    h = h.lstrip('#'); return [((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)] + [1]

def flat(name, hexc, rough=0.85, emit=0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = lin(hexc); b.inputs['Roughness'].default_value = rough
    if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = 0.2
    if emit: b.inputs['Emission Color'].default_value = lin(hexc); b.inputs['Emission Strength'].default_value = emit
    return m

def planks(name, base, gap, scale, vertical=False):
    """wooden boards: a brick texture stretched into planks, its mortar the dark gap"""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    mp.inputs['Scale'].default_value = (scale * (0.25 if not vertical else 1), scale * (1 if not vertical else 0.25), scale)
    if vertical: mp.inputs['Rotation'].default_value = (0, 0, 0)
    br = nt.nodes.new('ShaderNodeTexBrick'); nt.links.new(mp.outputs[0], br.inputs['Vector'])
    br.inputs['Color1'].default_value = lin(base); br.inputs['Color2'].default_value = [c * 0.82 for c in lin(base)[:3]] + [1]
    br.inputs['Mortar'].default_value = lin(gap); br.inputs['Mortar Size'].default_value = 0.012; br.inputs['Brick Width'].default_value = 2.0; br.inputs['Row Height'].default_value = 0.25
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 40; nt.links.new(mp.outputs[0], nz.inputs['Vector'])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 0.25
    nt.links.new(br.outputs['Color'], mix.inputs[6]); nt.links.new(nz.outputs['Color'], mix.inputs[7]); nt.links.new(mix.outputs[2], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.8
    return m

def box(name, size, loc, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.active_object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True); o.data.materials.append(mat); return o

def plane(name, w, h, loc, rot, mat):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot); o = bpy.context.active_object; o.name = name; o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True); o.data.materials.append(mat); return o

# a shop model, its footprint centred on (x, y), its base on the floor, turned (degrees about z); the page's put()
def put(name, x, y, rot=0, z=0, tag=None):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(MODELS, name + '.glb'))
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        for m in (o.data.materials if o.type == 'MESH' else []):
            if not m: continue
            p = palette.get(m.name.split('.')[0])
            if m.name.startswith('Ink'): m.use_backface_culling = True; continue
            if p and p.get('kind') == 'glow' and m.use_nodes:
                b = m.node_tree.nodes.get('Principled BSDF')
                if b: b.inputs['Emission Color'].default_value = lin(p['hex']); b.inputs['Emission Strength'].default_value = 4
    roots = [o for o in new if o.parent is None]
    bpy.context.view_layer.update()
    lo = Vector((1e9, 1e9, 1e9)); hi = -lo
    for o in new:
        if o.type == 'MESH':
            for c in o.bound_box:
                w = o.matrix_world @ Vector(c); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    pivot = bpy.data.objects.new(name + '_at', None); scene.collection.objects.link(pivot)
    for r in roots: r.parent = pivot; r.location -= Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
    pivot.location = (x, y, z); pivot.rotation_euler = (0, 0, math.radians(rot))
    for o in new: o['tag'] = tag or name
    bpy.context.view_layer.update()
    return pivot

# ---------- the room (Blender axes: x across, y toward the door, z up; the counter at y = -1.75, the door at y = 3.2) ----------
wall = planks('Wall', '#6b4a30', '#2f1c10', 1.1, vertical=True)
floor = planks('Floor', '#5a3a24', '#2a170c', 0.9)
dark = flat('Beam', '#3b2414')
plane('Floor', 6.4, 7.6, (0, 0, 0), (0, 0, 0), floor)
plane('WallL', 7.6, 3.4, (-3.2, 0, 1.7), (math.radians(90), 0, math.radians(90)), wall)
plane('WallR', 7.6, 3.4, (3.2, 0, 1.7), (math.radians(90), 0, math.radians(-90)), wall)
# the door wall, with its doorway open on a dusky street
for w, x in [(2.6, -1.9), (2.6, 1.9)]: plane('WallD', w, 3.4, (x, 3.2, 1.7), (math.radians(90), 0, 0), wall)
plane('WallDTop', 1.2, 1.2, (0, 3.2, 2.8), (math.radians(90), 0, 0), wall)
plane('Street', 1.2, 2.2, (0, 3.35, 1.1), (math.radians(90), 0, 0), flat('Dusk', '#31435c', 1, emit=0.6))
for w, h, x, z in [(0.16, 2.4, -0.68, 1.2), (0.16, 2.4, 0.68, 1.2), (1.52, 0.18, 0, 2.3)]: box('DoorFrame', (w, 0.18, h), (x, 3.12, z), dark)
# behind the counter: the back wall, a doorway to the workshop
for w, x in [(2.6, -1.9), (2.6, 1.9)]: plane('WallB', w, 3.4, (x, -3.6, 1.7), (math.radians(90), 0, math.radians(180)), wall)
plane('WallBTop', 1.2, 1.2, (0, -3.6, 2.8), (math.radians(90), 0, math.radians(180)), wall)
for w, h, x, z in [(0.16, 2.4, -0.68, 1.2), (0.16, 2.4, 0.68, 1.2), (1.52, 0.18, 0, 2.3)]: box('BackFrame', (w, 0.18, h), (x, -3.55, z), dark)
plane('WorkFloor', 4, 4, (0, -5.6, 0.002), (0, 0, 0), floor)
wd = flat('WorkWall', '#2e1d12')
plane('WorkBack', 4, 3.4, (0, -7.4, 1.7), (math.radians(90), 0, 0), wd)
for x in (-2, 2): plane('WorkSide', 4, 3.4, (x, -5.6, 1.7), (math.radians(90), 0, math.radians(90 if x < 0 else -90)), wd)
plane('Ceiling', 6.4, 11.4, (0, -2, 3.4), (math.radians(180), 0, 0), flat('Ceil', '#2a1a10'))
for y in (2.2, 0.6, -1.0, -2.6): box('Beam', (6.4, 0.22, 0.22), (0, y, 3.25), dark)

# the left wall: two display cases (two rows of three places each), their fronts to the room
CASES = [put('cardcase', -2.75, 1.5, 90), put('cardcase', -2.75, -0.6, 90)]
# the right wall: books, a stand of armour, a rack; the wall's places hang between
put('rack', 2.95, -2.3, -90); put('armorstand', 2.75, -1.45, -90); put('bookshelf', 3.0, 2.2, -90)   # the wall's places between the armour and the books
# by the door: banners, barrels, a lamp
put('banner', -1.4, 3.05, 180); put('banner', 1.4, 3.05, 180); put('barrels', -2.4, 2.6); put('lamp', 2.2, 2.7)
# the counter, across the front, and what stands on it
COUNTER = [put('counter', -0.78, -1.75, 0, tag='fg'), put('counter', 0.78, -1.75, 0, tag='fg')]
put('candles', -1.3, -1.7, 0, z=0.82, tag='fg')
# the workshop beyond the back doorway
put('forge', 0.5, -6.6, 0); put('anvil', -0.5, -5.4, 90); put('workbench', -1.4, -6.6, 0)

# the light: the lamp by the door, the candles on the counter, the door's dusk, the forge's glow, a little from above
def light(kind, energy, colour, loc, size=0.5):
    d = bpy.data.lights.new(kind + 'L', kind); d.energy = energy; d.color = colour
    if kind == 'AREA': d.size = size
    if hasattr(d, 'shadow_soft_size'): d.shadow_soft_size = size
    o = bpy.data.objects.new(d.name, d); o.location = loc; scene.collection.objects.link(o); return o
light('POINT', 260, (1.0, 0.68, 0.38), (2.2, 2.4, 1.7), 0.3)
light('POINT', 130, (1.0, 0.75, 0.45), (-1.3, -1.6, 1.25), 0.15)
light('POINT', 180, (1.0, 0.6, 0.32), (-2.0, 0.4, 2.4), 0.6)
light('AREA', 120, (0.5, 0.65, 0.9), (0, 3.0, 1.6), 1.2).rotation_euler = (math.radians(90), 0, 0)
light('POINT', 520, (1.0, 0.45, 0.18), (0.5, -6.1, 1.0), 0.4)
light('AREA', 90, (1.0, 0.8, 0.6), (0, -0.5, 3.2), 4.0)
scene.world = bpy.data.worlds.new('w'); scene.world.use_nodes = True
bg = scene.world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.09, 0.055, 0.035, 1); bg.inputs[1].default_value = 0.35

for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try: scene.render.engine = eng; break
    except TypeError: pass
try: scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
except TypeError: pass
scene.view_settings.exposure = 0.35
scene.render.image_settings.file_format = 'WEBP'; scene.render.image_settings.quality = 80
for k, v in (('taa_render_samples', 96), ('use_shadows', True), ('shadow_ray_count', 2), ('shadow_step_count', 8)):
    try: setattr(scene.eevee, k, v)
    except (AttributeError, TypeError): pass

# ---------- the places: a display case's six (tools/station_props.py CASE_ROWS: js/diorama.js LAYOUTS[2]), the wall's six ----------
CASE_LEAN = math.pi / 6
CASE_ROWS = [(0.36, 0.55 + 0.017), (-0.02, 1.24 + 0.017)]   # the page's (z toward the front, y up), in the model's own frame
CASE_XS, CASE_W = (-0.6, 0, 0.6), 0.5
CARD_RATIO = 360 / 256
def case_quads(pivot):
    """each place's card: its bottom edge on the baize, leaning back, as four corners in the world (bl, br, tr, tl)"""
    out = []
    for z, y in CASE_ROWS:
        for x in CASE_XS:
            h = CASE_W * CARD_RATIO
            # three.js (x, y, z) to Blender (x, -z, y); leaning back: up the card goes back (+y in Blender, away from the front at -y)
            up = Vector((0, math.sin(CASE_LEAN), math.cos(CASE_LEAN)))
            bl = Vector((x - CASE_W / 2, -z, y)); br = Vector((x + CASE_W / 2, -z, y))
            out.append([pivot.matrix_world @ p for p in (bl, br, br + up * h, bl + up * h)])
    return out
def wall_quads():
    """the wall's places on the right wall, between the rack and the books: two rows of three, flat on the boards, facing the room"""
    out = []
    for z in (1.85, 1.2):
        for y in (0.3, 0.72, 1.14):
            w, h = 0.3, 0.3 * CARD_RATIO
            out.append([Vector((3.17, y + w / 2, z - h / 2)), Vector((3.17, y - w / 2, z - h / 2)), Vector((3.17, y - w / 2, z + h / 2)), Vector((3.17, y + w / 2, z + h / 2))])
    return out
bpy.context.view_layer.update()
SHELF_PLACES = [q for p in CASES for q in case_quads(p)]   # 12: the left wall's places, nearest the door first
WALL_PLACES = wall_quads()
# where customers stand: at the counter (the front of the queue), then the queue and browsers further back
SPOTS = [(0.1, -1.05), (-0.95, 0.35), (1.05, 0.95), (-0.35, 1.9), (1.6, 2.2)]

# ---------- the views: a camera behind the counter, at the eye's height, turned ----------
VIEWS = {   # (where the eye is, what it looks at, the vertical field of view in degrees) for each shape
    'counter': {'wide': ((0, -3.5, 1.62), (0, 2.0, 1.05), 54), 'tall': ((0, -3.0, 1.66), (0, 2.0, 1.18), 70)},
    'left': {'wide': ((0.3, -2.9, 1.6), (-3, 0.5, 1.0), 44), 'tall': ((0.4, -2.9, 1.6), (-3, 0.4, 1.05), 60)},
    'right': {'wide': ((-0.3, -2.9, 1.6), (3, 0.6, 1.15), 44), 'tall': ((-0.4, -2.9, 1.6), (3, 0.6, 1.2), 60)},
    'back': {'wide': ((0, -1.0, 1.62), (0, -7.0, 1.2), 58), 'tall': ((0, -1.4, 1.64), (0, -7.0, 1.25), 72)},
}
SHAPES = {'wide': (1600, 900), 'tall': (780, 860)}
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); scene.collection.objects.link(cam); scene.camera = cam
cam.data.sensor_fit = 'VERTICAL'; cam.data.clip_end = 60

def px(p, w, h):
    v = world_to_camera_view(scene, cam, p)
    return [round(v.x * w, 1), round((1 - v.y) * h, 1), v.z > 0]
def visible(q, w, h):
    pts = [px(p, w, h) for p in q]
    return all(p[2] for p in pts) and all(-0.2 * w < p[0] < 1.2 * w and -0.2 * h < p[1] < 1.2 * h for p in pts), [p[:2] for p in pts]

data = json.load(open(os.path.join(OUT, 'backdrops.json'))) if os.path.exists(os.path.join(OUT, 'backdrops.json')) else {}
fg_objs = [o for o in bpy.data.objects if o.get('tag') == 'fg']
for view, shapes in VIEWS.items():
    if args and view not in args: continue
    for shape, (eye, look, fov) in shapes.items():
        w, h = SHAPES[shape]
        scene.render.resolution_x, scene.render.resolution_y = w, h
        cam.location = eye; cam.rotation_euler = (Vector(look) - Vector(eye)).to_track_quat('-Z', 'Y').to_euler(); cam.data.angle = math.radians(fov)
        bpy.context.view_layer.update()
        rec = {'size': [w, h], 'places': {}, 'spots': [], 'hot': {}}
        # the room
        scene.render.film_transparent = False
        for o in bpy.data.objects: o.hide_render = False; o.is_holdout = False
        scene.render.filepath = os.path.join(OUT, f'{view}_{shape}.webp'); bpy.ops.render.render(write_still=True)
        # the counter's cut-out (it stands in front of the customers, and of the cards on the walls), in every view but the back
        if view != 'back':
            scene.render.film_transparent = True
            for o in bpy.data.objects:
                if o.type == 'MESH': o.is_holdout = o not in fg_objs and o.get('tag') != 'fg'
            scene.render.filepath = os.path.join(OUT, f'{view}_{shape}_fg.webp'); bpy.ops.render.render(write_still=True)
            for o in bpy.data.objects: o.is_holdout = False
            rec['fg'] = True
        if view == 'counter':
            for x, y in SPOTS:
                f = px(Vector((x, y, 0)), w, h); top = px(Vector((x, y, 1)), w, h)
                rec['spots'].append({'foot': f[:2], 'ppm': round(f[1] - top[1], 1)})
        for key, quads in (('shelf', SHELF_PLACES), ('wall', WALL_PLACES)):
            seen = []
            for i, q in enumerate(quads):
                ok, pts = visible(q, w, h)
                if ok: seen.append({'i': i, 'q': pts})
            if seen and view in ('left', 'right') and ((key == 'shelf') == (view == 'left')): rec['places'][key] = seen
        if view == 'back':
            d = [px(Vector(p), w, h)[:2] for p in ((-0.6, -3.6, 0), (0.6, -3.6, 0), (0.6, -3.6, 2.2), (-0.6, -3.6, 2.2))]
            rec['hot']['workshop'] = d
        data.setdefault(view, {})[shape] = rec
        print('VIEW', view, shape, {k: len(v) for k, v in rec['places'].items()}, 'spots', len(rec['spots']))
json.dump(data, open(os.path.join(OUT, 'backdrops.json'), 'w'), indent=1)
print('DONE', OUT)
