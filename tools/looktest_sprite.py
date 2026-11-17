"""A look test: a customer as a flat picture (an Eye of the Beholder sprite), rendered from Darkclay Zero's dressed stylized bodies.

Run with Blender (headless):
  blender -b -P tools/looktest_sprite.py -- <Gear_*.fbx> <base_color.png> <out prefix> [width] [height]

It puts the body's painted skin back on, colours the outfit from its material names (G_leather_8a5a30), lights it warm from
the front with a cool rim behind (the shop's lamps and the door), and renders two poses, each a transparent WebP:
<prefix>_idle.webp (standing, looking at you) and <prefix>_offer.webp (one hand held out, head tilted). Not part of the game.
"""
import bpy, sys, os, math
from mathutils import Vector, Euler

args = sys.argv[sys.argv.index('--') + 1:]
fbx, skin, prefix = args[0], args[1], args[2]
W = int(args[3]) if len(args) > 3 else 480
H = int(args[4]) if len(args) > 4 else 720
TEX = os.environ.get('TEX')   # Zero's tileable gear maps (art-source/blender/textures/gear), if given
TILE = {'mail': 34.0, 'leather': 7.0, 'cloth': 10.0}
TILE_UV = {'mail': 1.0, 'leather': 1.0, 'cloth': 1.0}   # the Tile UVs are already scaled for the maps
NSTR = {'mail': 2.5, 'leather': 2.0, 'cloth': 2.0}

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=fbx)
scene = bpy.context.scene
arm = next(o for o in scene.objects if o.type == 'ARMATURE')
for o in [o for o in scene.objects if o.type == 'MESH' and o.name in os.environ.get('HIDE', '').split(',')]: bpy.data.objects.remove(o)   # HIDE=helm: leave a piece off
meshes = [o for o in scene.objects if o.type == 'MESH']

def hexrgb(h):
    return [((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)] + [1]

for o in meshes:
    for i, m in enumerate(o.data.materials):
        if not m: continue
        m.use_nodes = True
        nt = m.node_tree; nt.nodes.clear()
        out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled')
        nt.links.new(b.outputs[0], out.inputs[0])
        b.inputs['Roughness'].default_value = 0.75
        if m.name.startswith('Body'):
            t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(skin)
            nt.links.new(t.outputs[0], b.inputs['Base Color'])
            b.inputs['Roughness'].default_value = 0.6
        else:
            hx = m.name.split('_')[-1][:6]
            try: col = hexrgb(hx)
            except ValueError: col = (0.4, 0.3, 0.2, 1)
            kind = next((k for k in ('mail', 'leather', 'cloth') if k in m.name), 'cloth' if 'padded' in m.name else 'leather' if 'plate' not in m.name else 'mail')
            if TEX and os.path.exists(os.path.join(TEX, kind + '_base.png')):
                # Zero's tileable gear maps: the grey base tinted by the material's colour, bumped by itself, its roughness
                # the garment's own tiling UVs ('Tile', made for these maps), else 0–1 across it
                tile = 'Tile' if 'Tile' in o.data.uv_layers else None
                if tile: uv = nt.nodes.new('ShaderNodeUVMap'); uv.uv_map = tile; src = uv.outputs[0]
                else: tc = nt.nodes.new('ShaderNodeTexCoord'); src = tc.outputs['Generated']
                mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (TILE[kind] if not tile else TILE_UV[kind],) * 3
                nt.links.new(src, mp.inputs['Vector'])
                def tex(name, colour=True):
                    t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(TEX, kind + '_' + name + '.png'))
                    if not colour: t.image.colorspace_settings.name = 'Non-Color'
                    if not tile: t.projection = 'BOX'; t.projection_blend = 0.3
                    nt.links.new(mp.outputs[0], t.inputs['Vector']); return t
                base = tex('base')
                bc = nt.nodes.new('ShaderNodeBrightContrast'); bc.inputs['Bright'].default_value = -0.05; bc.inputs['Contrast'].default_value = 0.9
                nt.links.new(base.outputs[0], bc.inputs['Color'])
                mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1.0
                mix.inputs[6].default_value = [c * 0.9 for c in col[:3]] + [1]; nt.links.new(bc.outputs[0], mix.inputs[7])
                nt.links.new(mix.outputs[2], b.inputs['Base Color'])
                nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = NSTR[kind]
                if tile: nm.uv_map = tile
                nt.links.new(tex('normal', False).outputs[0], nm.inputs['Color']); nt.links.new(nm.outputs[0], b.inputs['Normal'])
                nt.links.new(tex('rough', False).outputs[0], b.inputs['Roughness'])
                if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = 0.25
            else: b.inputs['Base Color'].default_value = col
            if kind == 'mail':
                b.inputs['Metallic'].default_value = 0.55

# HAIR / BEARD (env): Zero's pieces (Art/Models/Hair_*.fbx, Beard_*.fbx), placed by its own fit for this body (world.json → art →
# stylized → heads → BODY → pieces: the offset from the Head bone in Unity's axes, a per-axis scale, a tilt), parented to the Head
# bone so they follow the pose, their grey map tinted HAIRCOL
import json
def hang(piece, colour):
    zero = os.environ.get('ZERO'); body = os.environ.get('BODY')
    fit = json.load(open(os.path.join(zero, 'data/zero/world.json')))['art']['stylized']['heads'][body]['pieces'].get(piece)
    if not fit: print('NOFIT', piece); return
    models = os.path.join(zero, 'unity/Assets/_Darkclay/Art/Models')
    before = set(scene.objects)
    bpy.ops.import_scene.fbx(filepath=os.path.join(models, piece + '.fbx'))
    new = [o for o in scene.objects if o not in before]
    bone = arm.data.bones['Head']; head = arm.matrix_world @ bone.head_local
    ux, uy, uz, sx, sy, sz = fit[:6]; tilt = fit[6] if len(fit) > 6 else 0
    for o in new:
        if o.type != 'MESH': bpy.data.objects.remove(o); continue
        o.location = head + Vector((-ux, -uz, uy))   # Unity (x, y, z) = Blender (-x, z, -y)
        o.scale = (o.scale.x * sx, o.scale.y * sz, o.scale.z * sy)
        o.rotation_euler.x += math.radians(tilt)
        bpy.context.view_layer.update()
        mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = 'Head'; o.matrix_world = mw
        for m in o.data.materials:
            if not m: continue
            m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
            out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled'); nt.links.new(b.outputs[0], out.inputs[0])
            t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(models, piece + '_base.png'))
            mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1.0
            mix.inputs[6].default_value = colour; nt.links.new(t.outputs[0], mix.inputs[7]); nt.links.new(mix.outputs[2], b.inputs['Base Color'])
            b.inputs['Roughness'].default_value = 0.55
        meshes.append(o)
    print('HUNG', piece, len(new))
for env in ('HAIR', 'BEARD'):
    if os.environ.get(env): hang(os.environ[env], hexrgb(os.environ.get('HAIRCOL', '3b2616')))

# the figure's size, for the camera and the lights
lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
for o in meshes:
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c); lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
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
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.08, 0.05, 0.03, 1); scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.6

# the camera: from the shopkeeper's side of the counter, a little above their eyes and a touch to one side
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); scene.collection.objects.link(cam); scene.camera = cam
cam.data.lens = 60
target = Vector((mid.x, mid.y, lo.z + 0.55 * h))
cam.location = Vector((mid.x - 0.55 * h, lo.y - 3.1 * h, lo.z + 0.85 * h))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.sensor_fit = 'VERTICAL'

scene.render.resolution_x, scene.render.resolution_y = W, H
scene.render.film_transparent = True
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try: scene.render.engine = eng; break
    except TypeError: pass
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.quality = 82
try: scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
except TypeError: pass
scene.view_settings.exposure = -0.55   # the outfit's colours stay themselves, not washed pale

# the poses: bones turned in their own frames (an 8-bone walker: Torso, Head, ArmL/R, HandL/R, LegL/R)
def pose(spec):
    for b in arm.pose.bones: b.rotation_mode = 'XYZ'; b.rotation_euler = (0, 0, 0)
    for name, rot in spec.items():
        if name in arm.pose.bones: arm.pose.bones[name].rotation_euler = Euler([math.radians(a) for a in rot], 'XYZ')
    bpy.context.view_layer.update()
POSES = {
    'idle': {'Head': (6, 0, -8), 'ArmL': (0, 0, 6), 'ArmR': (0, 0, -6)},
    'offer': {'Head': (-4, 0, 14), 'Torso': (0, 0, -6), 'ArmR': (-70, 0, -10), 'HandR': (-20, 0, 0), 'ArmL': (0, 0, 8)},
    # the haggle's faces, by the body: pleased (head up, arms open), offended (head back and turned away, arms in)
    'pleased': {'Head': (-12, 0, 6), 'Torso': (-4, 0, 0), 'ArmL': (-20, 0, 32), 'ArmR': (-20, 0, -32), 'HandL': (-15, 0, 0), 'HandR': (-15, 0, 0)},
    'offended': {'Head': (-8, 0, -24), 'Torso': (4, 0, 8), 'ArmL': (-55, 0, -30), 'ArmR': (-55, 0, 30), 'HandL': (-60, 0, 0), 'HandR': (-60, 0, 0)},
}
POSES = {k: v for k, v in POSES.items() if not os.environ.get('POSES') or k in os.environ['POSES'].split(',')}
for name, spec in POSES.items():
    pose(spec)
    scene.render.filepath = prefix + '_' + name + '.webp'
    bpy.ops.render.render(write_still=True)
    print('SPRITE', os.path.basename(scene.render.filepath), os.path.getsize(scene.render.filepath))
