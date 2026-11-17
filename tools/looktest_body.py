"""A look test: one of Darkclay Zero's stylized Meshy bodies, made light enough for the Forge's shop.

Run with Blender (headless):
  blender -b -P tools/looktest_body.py -- <in.glb> <out.glb> <height m> [triangles] [head scale] [colours]

It cuts the mesh down (collapse decimate), shrinks the painted texture and flattens it into a few colours (a cel look rather
than a painting), makes the head a little bigger (chunkier at small sizes), adds the Forge's black outline (an inverted hull
named Ink), and sets the height in metres. Not part of the game: an experiment for the developer to look at.
"""
import bpy, bmesh, sys, os
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
src, out, height = args[0], args[1], float(args[2])
tris = int(args[3]) if len(args) > 3 else 2500
head_x = float(args[4]) if len(args) > 4 else 1.2
levels = int(args[5]) if len(args) > 5 else 6

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1: bpy.ops.object.join()
body = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# the height: feet on the floor, centred, scaled to `height` metres (Blender's z is up)
def bounds(o):
    vs = [o.matrix_world @ v.co for v in o.data.vertices]
    return Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))), Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
lo, hi = bounds(body)
s = height / (hi.z - lo.z)
for v in body.data.vertices:
    v.co = Vector(((v.co.x - (lo.x + hi.x) / 2) * s, (v.co.y - (lo.y + hi.y) / 2) * s, (v.co.z - lo.z) * s))

# a bigger head: everything above the neck scaled about the neck, blended over a short span so the neck stays smooth
neck = height * 0.84
blend = height * 0.05
for v in body.data.vertices:
    if v.co.z > neck - blend:
        t = min(1.0, (v.co.z - (neck - blend)) / blend)
        k = 1 + (head_x - 1) * t
        v.co.x *= k; v.co.y *= k
        v.co.z = neck - blend + (v.co.z - (neck - blend)) * k if v.co.z > neck - blend else v.co.z
body.data.update()

# fewer triangles
before = sum(len(p.vertices) - 2 for p in body.data.polygons)
m = body.modifiers.new('cut', 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = min(1.0, tris / max(1, before))
bpy.ops.object.modifier_apply(modifier='cut')
after = sum(len(p.vertices) - 2 for p in body.data.polygons)

# the painted texture: 256 px, its colours flattened into a few steps (the toon bands do the shading)
for mat in body.data.materials:
    if not mat or not mat.use_nodes: continue
    mat.name = 'Body'
    for n in mat.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image:
            img = n.image; img.reload() if not img.has_data and not img.packed_file else None; _ = img.pixels[0]   # a packed image loads when touched
            if max(img.size) > 256: img.scale(256, 256)
            px = list(img.pixels)
            fresh = bpy.data.images.new('Body', img.size[0], img.size[1])   # a new image: the packed original would be exported otherwise
            q = lambda c: round(c * (levels - 1)) / (levels - 1)
            for i in range(0, len(px), 4):
                r, g, b = px[i], px[i + 1], px[i + 2]
                # a gentle lift, then the steps
                px[i], px[i + 1], px[i + 2] = q(min(1, r * 1.05)), q(min(1, g * 1.05)), q(min(1, b * 1.05))
            fresh.pixels[:] = px
            fresh.update(); fresh.pack()
            n.image = fresh
        if n.type == 'BSDF_PRINCIPLED':
            for k in ('Metallic', 'Specular IOR Level'):
                if k in n.inputs: n.inputs[k].default_value = 0.0
            n.inputs['Roughness'].default_value = 1.0
    mat.use_backface_culling = True

# FLAT=1: no painted skin at all: two of the shop's palette colours, Skin above the waist and Trousers below (by height)
if os.environ.get('FLAT') == '1':
    body.data.materials.clear()
    for nm in ('Skin', 'Trousers'): body.data.materials.append(bpy.data.materials.get(nm) or bpy.data.materials.new(nm))
    waist = height * 0.47
    for poly in body.data.polygons:
        z = sum(body.data.vertices[i].co.z for i in poly.vertices) / len(poly.vertices)
        poly.material_index = 1 if z < waist else 0

# the outline: an inverted hull, pushed out along the normals, its faces turned inward, drawn black (the page's Ink)
ink = body.copy(); ink.data = body.data.copy(); ink.name = 'Ink'
bpy.context.collection.objects.link(ink)
ink.data.materials.clear()
im = bpy.data.materials.new('Ink'); im.use_backface_culling = True; ink.data.materials.append(im)
bm = bmesh.new(); bm.from_mesh(ink.data)
bm.normal_update()
w = height * 0.012
for v in bm.verts: v.co += v.normal * w
bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
bm.to_mesh(ink.data); bm.free()
for p in ink.data.polygons: p.material_index = 0

bpy.ops.object.select_all(action='DESELECT')
body.select_set(True); ink.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_yup=True, use_selection=True, export_apply=True,
                          export_materials='EXPORT', export_image_format='JPEG', export_jpeg_quality=80, export_animations=False)
print('LOOK', os.path.basename(out), 'triangles', before, '->', after, 'bytes', os.path.getsize(out))
