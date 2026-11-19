"""The counter view's painted backdrops (milestones 25 and 28): the shop front built in Blender from the shop's own models, lit warm,
rendered from behind the counter for each view (the counter facing the door, the left wall, the right wall, turned round to the
workshop doorway) at two shapes (wide, and a phone held upright), for each shop size, with what the page lays over them:

  assets/backdrops/s<size>/<view>_<shape>.webp        the room, its left wall bare (your shelves are laid over it)
  assets/backdrops/s<size>/<view>_<shape>_fg.webp     the counter alone (its cut-out: it stands in front of the customers)
  assets/backdrops/s<size>/<view>_<shape>_u<k>_<model>.webp   the left wall's shelf at place k as a plain shelf (cardshelf) or a
                                                      display case (cardcase), cut out and cropped: the page draws your shelves
  assets/backdrops/s<size>/<view>_<shape>_<over>.webp the room's state, cut out and cropped: boards on the door after a break-in
                                                      (boards), the wall mended after a monster (mended), each regular's gift
  assets/backdrops/s<size>/back_<shape>_cold.webp     turned round with the forge cold (it broke)
  assets/backdrops/s<size>/backdrops.json             each picture's size; the shelves' sprites and every level's card places
                                                      (four corners, pixels); the wall's places; the customers' spots; the
                                                      overlays' boxes; where the wards hang; the hotspots

Run with Blender (headless), from the repository:
  blender -b -P tools/backdrops.py -- [size ...] [view ...]
SEA=1: the Greyshore's shop (milestone 43): whitewashed walls, scrubbed boards, grey sea and sky through the door, a cooler daylight,
into assets/backdrops/sea/s<size>/ (js/diorama.js's sea palette, so the two views match)
Then bump BACKDROPS_V in js/counter.js so browsers fetch the new pictures.
"""
import bpy, json, math, os, sys
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, 'assets/models')
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SIZES_WANTED = [int(a) for a in args if a.isdigit()] or [0, 1, 2]
VIEWS_WANTED = [a for a in args if not a.isdigit()]
QUICK = os.environ.get('QUICK')   # fewer samples, for tuning
SEA = os.environ.get('SEA')   # the coast's shop (milestone 43)
palette = json.load(open(os.path.join(MODELS, 'palette.json')))['slots']

def lin(h):
    h = h.lstrip('#'); return [((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)] + [1]

# ---------- the shop's sizes (data.js ROOM_SIZES: a small, a good, a fine shop): wider and deeper, more shelf places on the left ----------
SIZE = {0: {'half': 3.2, 'door': 3.2, 'units': [1.5, -0.6]},
        1: {'half': 3.8, 'door': 5.25, 'units': [3.55, 1.5, -0.6]},
        2: {'half': 4.4, 'door': 7.3, 'units': [5.6, 3.55, 1.5, -0.6]}}

def build(size):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    S = SIZE[size]; HW, DY = S['half'], S['door']; DEPTH = DY + 3.6; MID = (DY - 3.6) / 2

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
        br = nt.nodes.new('ShaderNodeTexBrick'); nt.links.new(mp.outputs[0], br.inputs['Vector'])
        br.inputs['Color1'].default_value = lin(base); br.inputs['Color2'].default_value = [c * 0.82 for c in lin(base)[:3]] + [1]
        br.inputs['Mortar'].default_value = lin(gap); br.inputs['Mortar Size'].default_value = 0.012; br.inputs['Brick Width'].default_value = 2.0; br.inputs['Row Height'].default_value = 0.25
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 40; nt.links.new(mp.outputs[0], nz.inputs['Vector'])
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 0.25
        nt.links.new(br.outputs['Color'], mix.inputs[6]); nt.links.new(nz.outputs['Color'], mix.inputs[7]); nt.links.new(mix.outputs[2], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = 0.8
        return m

    def tagged(objs, tag):
        for o in objs: o['tag'] = tag
        return objs

    def box(name, size_, loc, mat, tag='room', rot=(0, 0, 0)):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.active_object; o.name = name; o.scale = size_
        bpy.ops.object.transform_apply(scale=True); o.data.materials.append(mat); o['tag'] = tag; return o

    def plane(name, w, h, loc, rot, mat, tag='room'):
        bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot); o = bpy.context.active_object; o.name = name; o.scale = (w, h, 1)
        bpy.ops.object.transform_apply(scale=True); o.data.materials.append(mat); o['tag'] = tag; return o

    # a shop model, its footprint centred on (x, y), its base on the floor, turned (degrees about z); the page's put()
    def put(name, x, y, rot=0, z=0, tag='room', scale=1.0):
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
        pivot.location = (x, y, z); pivot.rotation_euler = (0, 0, math.radians(rot)); pivot.scale = (scale,) * 3
        for o in new: o['tag'] = tag
        bpy.context.view_layer.update()
        pivot['tag'] = tag
        return pivot

    # ---------- the room (Blender axes: x across, y toward the door, z up; the counter at y = -1.75, the door at y = DY) ----------
    # the coast's: whitewash over the boards, the floor scrubbed pale, the beams tarred grey-brown (diorama.js PALETTES.sea)
    wall = planks('Wall', '#8f887a', '#5e584d', 1.1, vertical=True) if SEA else planks('Wall', '#6b4a30', '#2f1c10', 1.1, vertical=True)
    floor = planks('Floor', '#685a4a', '#3a3128', 0.9) if SEA else planks('Floor', '#5a3a24', '#2a170c', 0.9)
    dark = flat('Beam', '#4e4438') if SEA else flat('Beam', '#3b2414')
    plane('Floor', HW * 2, DEPTH, (0, MID, 0), (0, 0, 0), floor)
    plane('WallL', DEPTH, 3.4, (-HW, MID, 1.7), (math.radians(90), 0, math.radians(90)), wall)
    plane('WallR', DEPTH, 3.4, (HW, MID, 1.7), (math.radians(90), 0, math.radians(-90)), wall)
    side = HW - 0.6
    for x in (-(0.6 + side / 2), 0.6 + side / 2): plane('WallD', side, 3.4, (x, DY, 1.7), (math.radians(90), 0, 0), wall)
    plane('WallDTop', 1.2, 1.2, (0, DY, 2.8), (math.radians(90), 0, 0), wall)
    if SEA:   # through the door: the quay's edge, the grey sea, a pale sky over it
        plane('Sky', 1.2, 1.3, (0, DY + 0.15, 1.55), (math.radians(90), 0, 0), flat('Sky', '#7d8b93', 1, emit=0.28))
        plane('Sea', 1.2, 0.75, (0, DY + 0.12, 0.62), (math.radians(90), 0, 0), flat('Sea', '#3e5058', 0.4, emit=0.3))
        plane('Quay', 1.2, 0.25, (0, DY + 0.1, 0.125), (math.radians(90), 0, 0), flat('Quay', '#5a5650', 1, emit=0.25))
    else: plane('Street', 1.2, 2.2, (0, DY + 0.15, 1.1), (math.radians(90), 0, 0), flat('Dusk', '#31435c', 1, emit=0.6))
    for w, h, x, z in [(0.16, 2.4, -0.68, 1.2), (0.16, 2.4, 0.68, 1.2), (1.52, 0.18, 0, 2.3)]: box('DoorFrame', (w, 0.18, h), (x, DY - 0.08, z), dark)
    # behind the counter: the back wall, a doorway to the workshop
    for x in (-(0.6 + side / 2), 0.6 + side / 2): plane('WallB', side, 3.4, (x, -3.6, 1.7), (math.radians(90), 0, math.radians(180)), wall)
    plane('WallBTop', 1.2, 1.2, (0, -3.6, 2.8), (math.radians(90), 0, math.radians(180)), wall)
    for w, h, x, z in [(0.16, 2.4, -0.68, 1.2), (0.16, 2.4, 0.68, 1.2), (1.52, 0.18, 0, 2.3)]: box('BackFrame', (w, 0.18, h), (x, -3.55, z), dark)
    plane('WorkFloor', 4, 4, (0, -5.6, 0.002), (0, 0, 0), floor)
    wd = flat('WorkWall', '#5a5246' if SEA else '#2e1d12')
    plane('WorkBack', 4, 3.4, (0, -7.4, 1.7), (math.radians(90), 0, 0), wd)
    for x in (-2, 2): plane('WorkSide', 4, 3.4, (x, -5.6, 1.7), (math.radians(90), 0, math.radians(90 if x < 0 else -90)), wd)
    plane('Ceiling', HW * 2, DEPTH + 4, (0, MID - 2, 3.4), (math.radians(180), 0, 0), flat('Ceil', '#9a9384' if SEA else '#2a1a10'))
    y = DY - 1.0
    while y > -3.6: box('Beam', (HW * 2, 0.22, 0.22), (0, y, 3.25), dark); y -= 1.6

    # the right wall: a rack, a stand of armour, books; the wall's six places hang between the armour and the books
    put('rack', HW - 0.25, -2.3, -90); put('armorstand', HW - 0.45, -1.45, -90); put('bookshelf', HW - 0.2, 2.2, -90)
    if size >= 1: put('chest', HW - 0.45, 3.6, -90); put('armorstand', HW - 0.45, 4.5, -90)
    if size >= 2: put('bookshelf', HW - 0.2, 6.2, -90)
    # by the door: crates and the lamp (the regulars' gifts go here too, when they're put out)
    put('crates', -HW + 0.55, DY - 0.55); put('lamp', HW - 0.45, DY - 0.5)
    # the counter, across the front, and what stands on it: the candles at its right end (the piece is held up on the left)
    tagged([put('counter', -0.78, -1.75, 0, tag='fg'), put('counter', 0.78, -1.75, 0, tag='fg')], 'fg')
    put('candles', 1.35, -1.7, 0, z=0.82, tag='fg')
    # the workshop beyond the back doorway
    put('forge', 0.5, -6.6, 0, tag='forge'); put('anvil', -0.5, -5.4, 90); put('workbench', -1.4, -6.6, 0)

    # ---------- what the page lays over: the left wall's shelves (each place as either model), the room's state, the gifts ----------
    UNITS = []
    for k, uy in enumerate(S['units']):
        UNITS.append({m: put(m, -HW + 0.45, uy, 90, tag=f'u{k}_{m}') for m in ('cardshelf', 'cardcase')})
    planksB = flat('Boards', '#7a5a38', 0.9)
    OVER = {
        # after a break-in: boards nailed across the doorway's lower half, a pale split in the frame
        'boards': [box('Board', (1.5, 0.05, 0.16), (0, DY - 0.2, z), planksB, tag='o_boards', rot=(0, math.radians(a), 0)) for z, a in ((0.55, 7), (1.0, -5), (1.45, 4))]
                  + [box('Split', (0.05, 0.05, 0.9), (-0.66, DY - 0.2, 1.1), flat('Raw', '#c9a77a'), tag='o_boards')],
        # after a monster: new boards let into the right wall by the door, paler than the rest, and claw marks not yet planed out
        'mended': [box('Patch', (1.1, 0.04, 0.9), (-HW + 1.15, DY - 0.03, 2.3), planks('NewWood', '#9c7248', '#3a2414', 1.1, vertical=True), tag='o_mended')]
                  + [box('Claw', (0.045, 0.03, 0.8), (-HW + 1.75 + i * 0.14, DY - 0.07, 1.75), flat('Gash', '#140a05'), tag='o_mended', rot=(0, math.radians(-24), 0)) for i in range(4)],
    }
    GIFTS = {'kettycandles': ('candlestand', (HW - 0.4, -0.45, -90), 1.0), 'watchbanner': ('banner', (-1.15, DY - 0.25, 180), 0.6),
             'bramsbarrels': ('barrels', (-1.95, DY - 0.5, 0), 0.9), 'corrowstatue': ('statue', (1.0, DY - 0.35, 180), 0.5),
             'marrowrail': ('herbrail', (1.9, DY - 0.2, 180), 0.7)}
    for g, (model, (gx, gy, gr), sc) in GIFTS.items(): OVER[g] = [put(model, gx, gy, gr, tag='o_' + g, scale=sc)]

    # ---------- the light: warm and low, for the pictures (the customers are lit warm from the front, a cool rim behind) ----------
    def light(kind, energy, colour, loc, size_=0.5, rot=None):
        d = bpy.data.lights.new(kind + 'L', kind); d.energy = energy; d.color = colour
        if kind == 'AREA': d.size = size_
        if hasattr(d, 'shadow_soft_size'): d.shadow_soft_size = size_
        o = bpy.data.objects.new(d.name, d); o.location = loc; scene.collection.objects.link(o)
        if rot: o.rotation_euler = rot
        return o
    light('POINT', 260, (1.0, 0.68, 0.38), (HW - 1.0, DY - 0.8, 1.7), 0.3)                  # the lamp by the door
    light('POINT', 120, (1.0, 0.75, 0.45), (1.35, -1.6, 1.25), 0.15)                      # the counter's candles
    for uy in S['units']: light('POINT', 180 * 2 / len(S['units']) + 30, (1.0, 0.6, 0.32), (-HW + 1.2, uy, 2.4), 0.6)  # over the shelves
    light('AREA', 140 if SEA else 120, (0.72, 0.8, 0.88) if SEA else (0.5, 0.65, 0.9), (0, DY - 0.6, 1.6), 1.2 if not SEA else 1.6, (math.radians(90), 0, 0))  # the street's dusk (the sea's grey day)
    forge_light = light('POINT', 520, (1.0, 0.45, 0.18), (0.5, -6.1, 1.0), 0.4)             # the forge's glow
    light('AREA', (90 + 20 * size) * (0.55 if SEA else 1), (0.9, 0.86, 0.8) if SEA else (1.0, 0.8, 0.6), (0, MID, 3.2), 4.0 + size * 1.5)
    if size: light('POINT', 120, (1.0, 0.62, 0.36), (0, DY - 2.4, 2.2), 0.5)              # a lamp hung mid-room in a bigger shop
    scene.world = bpy.data.worlds.new('w'); scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.07, 0.075, 0.08, 1) if SEA else (0.09, 0.055, 0.035, 1); bg.inputs[1].default_value = 0.35

    for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
        try: scene.render.engine = eng; break
        except TypeError: pass
    try: scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError: pass
    scene.view_settings.exposure = -0.15 if SEA else 0.35   # pale walls throw the light back: the coast's is shot darker
    scene.render.image_settings.file_format = 'WEBP'; scene.render.image_settings.quality = 80; scene.render.image_settings.color_mode = 'RGBA'
    for k, v in (('taa_render_samples', 24 if QUICK else 96), ('use_shadows', True), ('shadow_ray_count', 2), ('shadow_step_count', 8)):
        try: setattr(scene.eevee, k, v)
        except (AttributeError, TypeError): pass
    return scene, UNITS, OVER, forge_light, S

# ---------- the card places: each shelf level's (js/diorama.js LAYOUTS: a plain shelf's two, a display shelf's three, a case's six) ----------
CARD_RATIO = 360 / 256
def slope():
    fz, fy, bz, by, B = 0.38, 0.76, -0.32, 1.22, 0.04
    L = math.hypot(fz - bz, by - fy); n = ((by - fy) / L, (fz - bz) / L); u = ((bz - fz) / L, (by - fy) / L)
    z = 0.365; t = (fz + n[0] * B - z) / -u[0]; y = fy + n[1] * B + u[1] * t
    return z + n[0] * 0.008, y + n[1] * 0.008 + 0.017, math.asin(-u[0])
SZ, SY, SLEAN = slope()
CASE = math.pi / 6
LAYOUTS = {0: [(x, SZ, SY, SLEAN, 0.56) for x in (-0.46, 0.46)], 1: [(x, SZ, SY, SLEAN, 0.54) for x in (-0.6, 0, 0.6)],
           2: [(x, 0.36, 0.55 + 0.017, CASE, 0.5) for x in (-0.6, 0, 0.6)] + [(x, -0.02, 1.24 + 0.017, CASE, 0.5) for x in (-0.6, 0, 0.6)]}
def quads(pivot, lv):
    """each place's card: its bottom edge on the baize, leaning back, four corners in the world (bl, br, tr, tl)"""
    out = []
    for x, z, y, lean, w in LAYOUTS[lv]:
        h = w * CARD_RATIO; up = Vector((0, math.sin(lean), math.cos(lean)))   # three.js (x, y, z) to Blender (x, -z, y)
        bl = Vector((x - w / 2, -z, y)); br = Vector((x + w / 2, -z, y))
        out.append([pivot.matrix_world @ p for p in (bl, br, br + up * h, bl + up * h)])
    return out
def wall_quads(HW):
    out = []
    for z in (1.85, 1.2):
        for y in (0.3, 0.72, 1.14):
            w, h = 0.3, 0.3 * CARD_RATIO; x = HW - 0.03
            out.append([Vector((x, y + w / 2, z - h / 2)), Vector((x, y - w / 2, z - h / 2)), Vector((x, y - w / 2, z + h / 2)), Vector((x, y + w / 2, z + h / 2))])
    return out
SPOTS = [(0.1, -1.05), (-0.95, 0.35), (1.05, 0.95), (-0.35, 1.9), (1.6, 2.2)]   # at the counter, then the queue and browsers behind

def views(size, S):
    HW, DY = S['half'], S['door']; mid = sum(S['units']) / len(S['units'])
    return {   # (where the eye is, what it looks at, the vertical field of view in degrees) for each shape
        'counter': {'wide': ((0, -3.5, 1.62), (0, 2.0, 1.05), 54), 'tall': ((0, -3.0, 1.66), (0, 2.0, 1.18), 70)},
        'left': {'wide': ((0.3 + 0.5 * size, -2.9, 1.6), (-HW, mid + 0.2, 1.0), 44 + 4 * size), 'tall': ((0.4 + 0.5 * size, -2.9, 1.6), (-HW, mid + 0.1, 1.05), 60 + 4 * size)},
        'right': {'wide': ((-0.3, -2.9, 1.6), (HW, 0.6, 1.15), 44), 'tall': ((-0.4, -2.9, 1.6), (HW, 0.6, 1.2), 60)},
        'back': {'wide': ((0, -1.0, 1.62), (0, -7.0, 1.2), 58), 'tall': ((0, -1.4, 1.64), (0, -7.0, 1.25), 72)},
    }
SHAPES = {'wide': (1600, 900), 'tall': (780, 860)}

for size in SIZES_WANTED:
    OUT = os.path.join(ROOT, 'assets/backdrops', *(['sea'] if SEA else []), 's%d' % size); os.makedirs(OUT, exist_ok=True)
    scene, UNITS, OVER, forge_light, S = build(size)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); scene.collection.objects.link(cam); scene.camera = cam
    cam.data.sensor_fit = 'VERTICAL'; cam.data.clip_end = 60
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    tag = lambda o: o.get('tag', 'room')

    def px(p, w, h):
        v = world_to_camera_view(scene, cam, p); return [round(v.x * w, 1), round((1 - v.y) * h, 1), v.z > 0]
    def visible(q, w, h):
        pts = [px(p, w, h) for p in q]
        return all(p[2] for p in pts) and all(-0.2 * w < p[0] < 1.2 * w and -0.2 * h < p[1] < 1.2 * h for p in pts), [p[:2] for p in pts]
    def bbox(objs, w, h):
        """the pixel box of these objects in view (None if off it), padded"""
        xs, ys = [], []
        for o in objs:
            for m in ([o] if o.type == 'MESH' else [c for c in o.children_recursive if c.type == 'MESH']):
                for c in m.bound_box:
                    p = px(m.matrix_world @ Vector(c), w, h)
                    if not p[2]: return None
                    xs.append(p[0]); ys.append(p[1])
        if not xs: return None
        x0, x1, y0, y1 = max(0, min(xs) - 6), min(w, max(xs) + 6), max(0, min(ys) - 6), min(h, max(ys) + 6)
        return None if x1 - x0 < 8 or y1 - y0 < 8 else [int(x0), int(y0), int(math.ceil(x1)), int(math.ceil(y1))]
    def shoot(path, show, crop=None):
        """render: show(o) -> 'on' (drawn), 'hold' (cuts out what's behind it), 'off'; crop: a pixel box to render alone"""
        any_hold = False
        for o in meshes:
            s = show(o); o.hide_render = s == 'off'; o.is_holdout = s == 'hold'; any_hold |= s == 'hold'
        scene.render.film_transparent = any_hold or crop is not None
        r = scene.render; r.use_border = bool(crop); r.use_crop_to_border = bool(crop)
        if crop:
            w, h = r.resolution_x, r.resolution_y; x0, y0, x1, y1 = crop
            r.border_min_x, r.border_max_x = x0 / w, x1 / w; r.border_min_y, r.border_max_y = 1 - y1 / h, 1 - y0 / h
        r.filepath = path; bpy.ops.render.render(write_still=True)
        for o in meshes: o.hide_render = False; o.is_holdout = False
        r.use_border = False

    data = {}
    for view, shapes in views(size, S).items():
        if VIEWS_WANTED and view not in VIEWS_WANTED: continue
        for shape, (eye, look, fov) in shapes.items():
            w, h = SHAPES[shape]
            scene.render.resolution_x, scene.render.resolution_y = w, h
            cam.location = eye; cam.rotation_euler = (Vector(look) - Vector(eye)).to_track_quat('-Z', 'Y').to_euler(); cam.data.angle = math.radians(fov)
            bpy.context.view_layer.update()
            rec = {'size': [w, h], 'units': [], 'wall': [], 'spots': [], 'hot': {}, 'over': {}}
            base = lambda o: 'on' if tag(o) in ('room', 'fg', 'forge') else 'off'
            shoot(os.path.join(OUT, f'{view}_{shape}.webp'), base)
            if view == 'back':   # the forge gone cold: no glow, its coals dark
                forge_light.hide_render = True
                for o in meshes:
                    if tag(o) == 'forge':
                        for m in o.data.materials:
                            b = m and m.use_nodes and m.node_tree.nodes.get('Principled BSDF')
                            if b: b['was'] = b.inputs['Emission Strength'].default_value; b.inputs['Emission Strength'].default_value = 0
                shoot(os.path.join(OUT, f'{view}_{shape}_cold.webp'), base)
                forge_light.hide_render = False
                for o in meshes:
                    if tag(o) == 'forge':
                        for m in o.data.materials:
                            b = m and m.use_nodes and m.node_tree.nodes.get('Principled BSDF')
                            if b and 'was' in b: b.inputs['Emission Strength'].default_value = b['was']
                rec['cold'] = True
            # the counter's cut-out, in every view but the back
            if view != 'back':
                shoot(os.path.join(OUT, f'{view}_{shape}_fg.webp'), lambda o: 'on' if tag(o) == 'fg' else 'hold' if tag(o) in ('room', 'forge') else 'off')
                rec['fg'] = True
            # the left wall's shelves: each place as a plain shelf and as a case, cut out where the room stands in front, cropped
            for k, unit in enumerate(UNITS):
                u = {'k': k, 'sprites': {}, 'quads': {}}
                for model, pivot in unit.items():
                    objs = [o for o in meshes if tag(o) == f'u{k}_{model}']
                    b = bbox(objs, w, h)
                    if not b: continue
                    shoot(os.path.join(OUT, f'{view}_{shape}_u{k}_{model}.webp'), lambda o, t=f'u{k}_{model}': 'on' if tag(o) == t else 'hold' if tag(o) in ('room', 'fg', 'forge') else 'off', b)
                    u['sprites'][model] = b
                    for lv in ((0, 1) if model == 'cardshelf' else (2,)):
                        qs = [visible(q, w, h) for q in quads(pivot, lv)]
                        if all(ok for ok, _ in qs): u['quads'][str(lv)] = [p for _, p in qs]
                if u['sprites']: rec['units'].append(u)
            # the room's state and the gifts: cut out and cropped, in the views that see them
            for name, objs in OVER.items():
                b = bbox(objs, w, h)
                if not b or view == 'back': continue
                shoot(os.path.join(OUT, f'{view}_{shape}_{name}.webp'), lambda o, t='o_' + name: 'on' if tag(o) == t else 'hold' if tag(o) in ('room', 'fg', 'forge') else 'off', b)
                rec['over'][name] = b
            if view == 'right':
                rec['wall'] = [{'i': i, 'q': pts} for i, q in enumerate(wall_quads(S['half'])) for ok, pts in [visible(q, w, h)] if ok]
            if view == 'counter':
                for x, y in SPOTS:
                    f = px(Vector((x, y, 0)), w, h); top = px(Vector((x, y, 1)), w, h)
                    rec['spots'].append({'foot': f[:2], 'ppm': round(f[1] - top[1], 1)})
                # the wards hang over the door: the lintel's two ends
                rec['wards'] = [px(Vector((-0.62, S['door'] - 0.2, 2.5)), w, h)[:2], px(Vector((0.62, S['door'] - 0.2, 2.5)), w, h)[:2]]
            if view == 'back':
                rec['hot']['workshop'] = [px(Vector(p), w, h)[:2] for p in ((-0.6, -3.6, 0), (0.6, -3.6, 0), (0.6, -3.6, 2.2), (-0.6, -3.6, 2.2))]
            data.setdefault(view, {})[shape] = rec
            print('VIEW', size, view, shape, 'units', [(u['k'], list(u['sprites']), list(u['quads'])) for u in rec['units']], 'wall', len(rec['wall']), 'over', list(rec['over']), flush=True)
    path = os.path.join(OUT, 'backdrops.json')
    old = json.load(open(path)) if os.path.exists(path) and VIEWS_WANTED else {}
    old.update(data); json.dump(old, open(path, 'w'), separators=(',', ':'))
    print('DONE', OUT, flush=True)
