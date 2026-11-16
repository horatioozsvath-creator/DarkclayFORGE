"""Darkclay Zero's Blender-built FBX models to GLB for the shop diorama.

Run with Blender (headless):
  blender -b -P tools/fbx2glb.py -- <zero models folder> <out folder> name=File[+File...] ...

Each name becomes <out>/<name>.glb from one or more FBX files (a walker and its outfit go together).
Materials keep their palette slot names (celkit.py: toon, glow, ink); the colours come from Zero's palette.json, so the page
can rebuild the cel look: toon bands, a glow, and the baked inverted-hull outline drawn black.
"""
import bpy, json, os, sys

args = sys.argv[sys.argv.index('--') + 1:]
src, out, specs = args[0], args[1], args[2:]
palette = json.load(open(os.path.join(src, 'palette.json')))['slots']
os.makedirs(out, exist_ok=True)


def hex_rgb(h):
    h = h.lstrip('#')
    return [((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)]   # sRGB to linear


def slot_of(name):
    base = name.split('.')[0]
    for key in (base, base.replace('M_Toon_', ''), base.replace('M_', '')):
        if key in palette:
            return key, palette[key]
    return base, None


used = {}
for spec in specs:
    name, files = spec.split('=', 1)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for f in files.split('+'):
        bpy.ops.import_scene.fbx(filepath=os.path.join(src, f + '.fbx'))
    for m in bpy.data.materials:
        key, p = slot_of(m.name)
        m.name = key
        m.use_nodes = True
        m.use_backface_culling = True   # the outline hull is drawn from its back faces only: never double-sided
        nt = m.node_tree
        bsdf = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None) or nt.nodes.new('ShaderNodeBsdfPrincipled')
        out_n = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None) or nt.nodes.new('ShaderNodeOutputMaterial')
        nt.links.new(bsdf.outputs[0], out_n.inputs[0])
        kind, hx = (p['kind'], p['hex']) if p else ('ink' if 'ink' in key.lower() else 'toon', '#000000' if 'ink' in key.lower() else '#808080')
        bsdf.inputs['Base Color'].default_value = hex_rgb(hx) + [1]
        bsdf.inputs['Roughness'].default_value = 1.0
        if kind == 'glow':
            bsdf.inputs['Emission Color'].default_value = hex_rgb(hx) + [1]
            bsdf.inputs['Emission Strength'].default_value = 1.0
        used[key] = {'hex': hx, 'kind': kind}
    path = os.path.join(out, name + '.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_yup=True, export_apply=True,
                              export_materials='EXPORT', export_animations=False, export_cameras=False, export_lights=False)
    print('GLB', name, os.path.getsize(path))

json.dump({'slots': used}, open(os.path.join(out, 'palette.json'), 'w'), indent=1, sort_keys=True)
