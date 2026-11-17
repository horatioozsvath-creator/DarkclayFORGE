"""The folk at the counter (milestone 26): one look from tools/folk.json, rendered as a transparent WebP picture.

Run with Blender (headless), usually through tools/folk.sh:
  ZERO=~/DarkclayZERO blender -b -P tools/folk.py -- <look id> <out.webp> [width] [height]

It builds the look from Darkclay Zero's stylized parts: the body (WalkerS_<body>, its painted skin), the outfit's garment cuts
(GearS_<body>: Cut_<cut>, tinted and textured with Zero's tileable gear maps), a head piece (PiecesS_<body>), and hair, a bald
crest and a beard (Hair_*, Bald_*, Beard_*), each placed by Zero's own fit for the body. Lit warm from the front with a cool rim
behind, seen from the shopkeeper's side of the counter, in the waiting pose.
"""
import bpy, sys, os, math, json
from mathutils import Vector, Euler

args = sys.argv[sys.argv.index('--') + 1:]
LOOK, OUT = args[0], args[1]
W = int(args[2]) if len(args) > 2 else 720
H = int(args[3]) if len(args) > 3 else 1080
ZERO = os.path.expanduser(os.environ.get('ZERO', '~/DarkclayZERO'))
HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(ZERO, 'unity/Assets/_Darkclay/Art/Models')
TEX = os.path.join(ZERO, 'art-source/blender/textures/gear')
look = json.load(open(os.path.join(HERE, 'folk.json')))['looks'][LOOK]
body = look['body']
STY = json.load(open(os.path.join(ZERO, 'data/zero/world.json')))['art']['stylized']
OUTFIT = json.load(open(os.path.join(ZERO, 'data/zero/gearlooks.json')))['stylized']['outfits'][look['outfit']]
TILE_UV = {'mail': 1.0, 'leather': 1.0, 'cloth': 1.0, 'padded': 1.0}
NSTR = {'mail': 2.5, 'leather': 2.0, 'cloth': 2.0, 'padded': 2.0}

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def imported(path):
    before = set(scene.objects)
    bpy.ops.import_scene.fbx(filepath=path)
    return [o for o in scene.objects if o not in before]

def hexrgb(h):
    h = h.lstrip('#'); return [((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)] + [1]

def fresh(o, name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    o.data.materials.clear(); o.data.materials.append(m)
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(b.outputs[0], out.inputs[0]); b.inputs['Roughness'].default_value = 0.75
    return nt, b

# ---- the body, its own skin
walker = imported(os.path.join(MODELS, 'WalkerS_' + body + '.fbx'))
arm = next(o for o in walker if o.type == 'ARMATURE')
meshes = []
for o in walker:
    if o.type != 'MESH': continue
    nt, b = fresh(o, 'skin')
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(MODELS, 'WalkerS_' + body + '_base.png'))
    uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'; nt.links.new(uv.outputs[0], t.inputs['Vector'])
    nt.links.new(t.outputs[0], b.inputs['Base Color']); b.inputs['Roughness'].default_value = 0.6
    meshes.append(o)

def adopt(objs):
    """Skinned parts from another file onto the walker's skeleton (the same bones), their own skeleton dropped."""
    for o in objs:
        if o.type != 'MESH': continue
        mw = o.matrix_world.copy(); o.parent = arm; o.matrix_world = mw
        for md in o.modifiers:
            if md.type == 'ARMATURE': md.object = arm
    for o in objs:
        if o.type == 'ARMATURE': bpy.data.objects.remove(o)

def gear(o, kind, col):
    nt, b = fresh(o, 'gear')
    tile = 'Tile' if 'Tile' in o.data.uv_layers else None
    tk = 'cloth' if kind == 'padded' else kind
    if not os.path.exists(os.path.join(TEX, tk + '_base.png')):
        b.inputs['Base Color'].default_value = col; return
    if tile: uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = tile; src = uv.outputs[0]
    else: tc = nt.nodes.new('ShaderNodeTexCoord'); src = tc.outputs['Generated']
    mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (TILE_UV[kind] if tile else 8.0,) * 3
    nt.links.new(src, mp.inputs['Vector'])
    def tex(name, colour=True):
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(TEX, tk + '_' + name + '.png'))
        if not colour: t.image.colorspace_settings.name = 'Non-Color'
        if not tile: t.projection = 'BOX'; t.projection_blend = 0.3
        nt.links.new(mp.outputs[0], t.inputs['Vector']); return t
    bc = nt.nodes.new('ShaderNodeBrightContrast'); bc.inputs['Bright'].default_value = -0.05; bc.inputs['Contrast'].default_value = 0.9
    nt.links.new(tex('base').outputs[0], bc.inputs['Color'])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1.0
    mix.inputs[6].default_value = [c * 0.9 for c in col[:3]] + [1]; nt.links.new(bc.outputs[0], mix.inputs[7])
    nt.links.new(mix.outputs[2], b.inputs['Base Color'])
    nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = NSTR[kind]
    if tile: nm.uv_map = tile
    nt.links.new(tex('normal', False).outputs[0], nm.inputs['Color']); nt.links.new(nm.outputs[0], b.inputs['Normal'])
    nt.links.new(tex('rough', False).outputs[0], b.inputs['Roughness'])
    if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = 0.25
    if kind == 'mail': b.inputs['Metallic'].default_value = 0.55

def colour(c):
    return hexrgb(look['seat'] if c == 'seat' else look.get('hood', look['seat']) if c == 'hood' else c)

# ---- the outfit: the cuts it names, each its material and colour
cuts = imported(os.path.join(MODELS, 'GearS_' + body + '.fbx'))
want = {c: (kind, colour(col)) for c, kind, col in OUTFIT}
for o in list(cuts):
    if o.type == 'MESH':
        name = o.name.split('.')[0].replace('Cut_', '')
        if name not in want: bpy.data.objects.remove(o); cuts.remove(o); continue
        gear(o, *want[name]); meshes.append(o)
adopt(cuts)

# ---- a head piece (a coif, a hood, the iron cap), in the look's colours
if look.get('piece'):
    pieces = imported(os.path.join(MODELS, 'PiecesS_' + body + '.fbx'))
    for o in list(pieces):
        if o.type == 'MESH':
            if o.name.split('.')[0] != look['piece']: bpy.data.objects.remove(o); pieces.remove(o); continue
            kind = 'mail' if look['piece'] in ('coif__Head', 'ironcap') else 'cloth'
            gear(o, kind, hexrgb('#a9adb4') if kind == 'mail' else colour('hood')); meshes.append(o)
    adopt(pieces)

# ---- hair, a bald crest, a beard: Zero's pieces placed by its fit for this body (the offset from the Head bone in Unity's
# axes, a per-axis scale, a tilt), parented to the Head bone, their grey map tinted the look's hair colour
def hang(piece, col):
    fit = STY['heads'][body]['pieces'].get(piece)
    if not fit: print('NOFIT', piece); return
    new = imported(os.path.join(MODELS, piece + '.fbx'))
    bone = arm.data.bones['Head']; head = arm.matrix_world @ bone.head_local
    ux, uy, uz, sx, sy, sz = fit[:6]; tilt = fit[6] if len(fit) > 6 else 0
    for o in new:
        if o.type != 'MESH': bpy.data.objects.remove(o); continue
        o.location = head + Vector((-ux, -uz, uy))   # Unity (x, y, z) = Blender (-x, z, -y)
        o.scale = (o.scale.x * sx, o.scale.y * sz, o.scale.z * sy)
        o.rotation_euler.x += math.radians(tilt)
        bpy.context.view_layer.update()
        mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = 'Head'; o.matrix_world = mw
        nt, b = fresh(o, 'hair')
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(MODELS, piece + '_base.png'))
        mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1.0
        mix.inputs[6].default_value = col; nt.links.new(t.outputs[0], mix.inputs[7]); nt.links.new(mix.outputs[2], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = 0.55
        meshes.append(o)
hc = hexrgb(look.get('hairCol', '#3b2616'))
covered = look.get('piece') in ('coif__Head', 'hoodF__Head', 'hoodL__Head', 'ironcap')
if look.get('hair') and not covered: hang(STY['hair'][look['hair']], hc)
if look.get('bald'): hang(STY['bald'][look['bald']], hc)
if look.get('beard'): hang(STY['beards'][look['beard']], hc)

# ---- the waiting pose (an 8-bone walker: Torso, Head, ArmL/R, HandL/R, LegL/R)
for b in arm.pose.bones: b.rotation_mode = 'XYZ'; b.rotation_euler = (0, 0, 0)
for name, rot in {'Head': (6, 0, -8), 'ArmL': (0, 0, 6), 'ArmR': (0, 0, -6)}.items():
    if name in arm.pose.bones: arm.pose.bones[name].rotation_euler = Euler([math.radians(a) for a in rot], 'XYZ')
bpy.context.view_layer.update()

# ---- the figure's size, for the camera and the lights
lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
dg = bpy.context.evaluated_depsgraph_get()
for o in meshes:
    ev = o.evaluated_get(dg)
    for v in ev.to_mesh().vertices:
        w = o.matrix_world @ v.co; lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    ev.to_mesh_clear()
h = hi.z - lo.z; mid = (lo + hi) / 2

def light(name, kind, energy, color, loc, size=1.0):
    d = bpy.data.lights.new(name, kind); d.energy = energy; d.color = color
    if kind == 'AREA': d.size = size
    o = bpy.data.objects.new(name, d); o.location = loc; scene.collection.objects.link(o)
    o.rotation_euler = (mid - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
light('key', 'AREA', 260 * h * h, (1.0, 0.78, 0.55), (mid.x - 1.4 * h, lo.y - 2.0 * h, lo.z + 1.5 * h), 1.2 * h)
light('fill', 'AREA', 70 * h * h, (1.0, 0.6, 0.4), (mid.x + 1.6 * h, lo.y - 1.6 * h, lo.z + 0.6 * h), 1.5 * h)
light('rim', 'AREA', 220 * h * h, (0.55, 0.7, 1.0), (mid.x + 0.6 * h, hi.y + 1.6 * h, lo.z + 1.4 * h), 0.8 * h)
scene.world = bpy.data.worlds.new('w'); scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.08, 0.05, 0.03, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.6

# ---- the camera: from the shopkeeper's side of the counter, a little above their eyes, a touch to one side; framed to the figure
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); scene.collection.objects.link(cam); scene.camera = cam
cam.data.lens = 60; cam.data.sensor_fit = 'VERTICAL'
target = Vector((mid.x, mid.y, lo.z + 0.5 * h))
cam.location = Vector((mid.x - 0.55 * h, lo.y - 3.1 * h, lo.z + 0.85 * h))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()

scene.render.resolution_x, scene.render.resolution_y = W, H
scene.render.film_transparent = True
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try: scene.render.engine = eng; break
    except TypeError: pass
try: scene.eevee.taa_render_samples = 64
except AttributeError: pass
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.quality = 82
try: scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
except TypeError: pass
scene.view_settings.exposure = -0.55
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('FOLK', LOOK, os.path.getsize(OUT))
