"""Two station props in Darkclay Zero's own Blender kit (celkit: its palette, toon bands and baked ink outline), so they match the
forge, the kettle and the stretcher: the bowyer's steam-bending bench and the glass furnace.

Run with Blender (headless), Zero's art-source/blender folder first:
  blender -b -P tools/station_props.py -- <DarkclayZERO/art-source/blender> <out folder>
It writes Prop_forge_bowbench.fbx and Prop_forge_glass.fbx; tools/models.sh then turns them into GLB like Zero's own.
Kit space: metres, x across, y up, z toward the front; a footprint's middle at the origin.
"""
import math, os, sys
import bpy

args = sys.argv[sys.argv.index('--') + 1:]
KIT, OUT = args[0], args[1]
sys.path.insert(0, KIT)
import celkit as K
from props import Prop, done, ball, rod, flame, plank_row
from world import gbox, beam, cyl, blob, tbox, extrude_x
from hearth import mats


def bowbench():
    """2 x 1: a long bending bench with its iron pegs and a stave clamped round them; at -x the steam box on its fire bowl, the
    steam pipe into the box, a bucket; a drawknife and shavings on the bench, a strung bow leaning at the back."""
    m = mats()
    with Prop('Prop_forge_bowbench', 0.035) as P:
        # the bench
        gbox('top', -0.2, 0.95, 0.72, 0.82, -0.3, 0.3, m['timber'])
        for sx in (-0.1, 0.85):
            for sz in (-0.22, 0.22): gbox('leg', sx - 0.05, sx + 0.05, 0.0, 0.72, sz - 0.05, sz + 0.05, m['timberdark'])
        gbox('rail', -0.1, 0.85, 0.22, 0.28, -0.03, 0.03, m['timberdark'])
        # the form: three iron pegs and the stave bent round them (a curve of rods), a clamp at each end
        for i, x in enumerate((0.0, 0.38, 0.76)): cyl('peg%d' % i, x, 0.05 if i == 1 else -0.1, 0.82, 0.98, 0.035, 0.035, m['iron'], seg=6)
        pts = []
        for i in range(9):
            t = i / 8.0
            pts.append((-0.05 + t * 0.86, 0.9, -0.18 + math.sin(t * math.pi) * 0.3))
        for i in range(8): rod('stave%d' % i, pts[i], pts[i + 1], 0.03, 0.03, m['heartwood'], seg=6)
        for x in (-0.06, 0.82): gbox('clamp', x - 0.05, x + 0.05, 0.82, 0.98, -0.24, -0.12, m['iron'])
        # a drawknife and the shavings
        beam('knife', (0.25, 0.84, 0.18), (0.6, 0.84, 0.2), 0.05, 0.012, m['steel'])
        for x in (0.22, 0.63): rod('handle', (x, 0.84, 0.19), (x, 0.84, 0.29), 0.022, 0.022, m['timberdark'], seg=5)
        K.no_ink(blob('shavings', (0.45, 0.0, 0.42), (0.35, 0.02, 0.18), m['straw'], K.rng(7), sub=1, flat_bottom=0.0))
        # the steam box on its fire: a stone bowl, coals and a low flame, a long plank box with a lid
        cyl('bowl', -0.62, 0.0, 0.0, 0.24, 0.3, 0.26, m['stone'], seg=10)
        K.no_ink(cyl('coals', -0.62, 0.0, 0.22, 0.26, 0.24, 0.24, m['coals'], seg=10))
        flame('fire', (-0.62, 0.26, 0.0), 0.16, 0.1, seed=11, tongues=3)
        for sx in (-0.88, -0.36):
            for sz in (-0.2, 0.2): gbox('boxleg', sx - 0.04, sx + 0.04, 0.0, 0.5, sz - 0.04, sz + 0.04, m['timberdark'])
        gbox('box', -0.95, -0.29, 0.5, 0.86, -0.26, 0.26, m['timberdark'])
        gbox('lid', -0.97, -0.27, 0.86, 0.92, -0.28, 0.28, m['timber'])
        plank_row('boxplanks', -0.95, -0.29, 0.52, 0.84, 0.26, 0.28, 4, m['timber'], gap=0.02, axis='y')
        # the steam: soft white puffs out of the box's end (no ink: steam has no edge)
        for i, (dx, dy) in enumerate(((0.0, 0.0), (0.05, 0.14), (-0.04, 0.27))):
            K.no_ink(ball('steam%d' % i, (-0.98 + dx, 0.98 + dy, 0.0), 0.08 + i * 0.03, m['paper'], seg=8, rings=5))
        # a strung bow leaning at the back, a bucket by the box
        bow = []
        for i in range(9):
            t = i / 8.0
            bow.append((0.55 + math.sin(t * math.pi) * 0.12, 0.05 + t * 1.25, -0.4))
        for i in range(8): rod('bow%d' % i, bow[i], bow[i + 1], 0.022, 0.022, m['heartwood'], seg=5)
        rod('string', bow[0], bow[-1], 0.006, 0.006, m['paper'], seg=3)
        cyl('bucket', -0.2, 0.36, 0.0, 0.3, 0.14, 0.17, m['timber'], seg=10)
        K.no_ink(cyl('water', -0.2, 0.36, 0.28, 0.29, 0.15, 0.15, m['water'], seg=10))
    return done(P)


def glassfurnace():
    """2 x 2: a beehive furnace of stone with its glowing glory hole toward the front, a chimney, a marver (an iron slab on its
    stand) at +x with a blowpipe across it and a gather on its end, a rack of pipes, finished glass cooling on a shelf."""
    m = mats()
    with Prop('Prop_forge_glass', 0.04) as P:
        # the furnace: a round stone base, a beehive dome, a chimney, the glory hole glowing
        cyl('base', -0.25, -0.15, 0.0, 0.45, 0.72, 0.7, m['stone'], seg=12)
        tbox('dome1', -0.25, -0.15, 0.45, 0.95, 1.3, 1.3, 1.05, 1.05, m['stone'])
        tbox('dome2', -0.25, -0.15, 0.95, 1.3, 1.05, 1.05, 0.6, 0.6, m['stone'])
        tbox('chimney', -0.35, -0.3, 1.3, 2.2, 0.32, 0.32, 0.26, 0.26, m['stonelight'])
        K.no_ink(cyl('mouthglow', -0.25, 0.42, 0.55, 0.85, 0.2, 0.2, m['goldglow'], seg=10))
        gbox('lintel', -0.55, 0.05, 0.85, 0.95, 0.35, 0.55, m['stonelight'])
        flame('fire', (-0.25, 0.55, 0.5), 0.22, 0.12, seed=5, tongues=3)
        # the marver: an iron slab on a timber stand, a blowpipe across it with its gather
        for sx in (0.42, 0.88):
            for sz in (0.3, 0.75): gbox('stand', sx - 0.04, sx + 0.04, 0.0, 0.7, sz - 0.04, sz + 0.04, m['timberdark'])
        gbox('marver', 0.36, 0.94, 0.7, 0.78, 0.25, 0.8, m['iron'])
        rod('pipe', (0.25, 0.86, 0.52), (0.95, 0.95, 0.6), 0.02, 0.02, m['steel'], seg=5)
        ball('gather', (0.24, 0.86, 0.52), 0.09, m['redglow'], seg=10, rings=6)
        # the pipes in their rack at the back
        gbox('rack', 0.45, 0.95, 0.0, 0.08, -0.9, -0.6, m['timberdark'])
        for i in range(4): rod('rackpipe%d' % i, (0.5 + i * 0.12, 0.05, -0.75), (0.55 + i * 0.12, 1.25, -0.88), 0.016, 0.016, m['steel'], seg=4)
        # finished glass cooling on a shelf: bottles, a goblet, a lens
        gbox('shelf', -0.95, -0.35, 0.0, 0.4, 0.62, 0.92, m['timber'])
        for i, (x, g) in enumerate(((-0.86, m['ice']), (-0.72, m['iceglow']), (-0.58, m['ice']))):
            cyl('bottle%d' % i, x, 0.77, 0.4, 0.62, 0.05, 0.05, g, seg=8)
            cyl('neck%d' % i, x, 0.77, 0.62, 0.72, 0.02, 0.02, g, seg=6)
        cyl('goblet', -0.44, 0.77, 0.4, 0.46, 0.05, 0.02, m['ice'], seg=8)
        cyl('cup', -0.44, 0.77, 0.46, 0.58, 0.03, 0.07, m['ice'], seg=8)
        # a sand bin
        gbox('bin', 0.55, 0.95, 0.0, 0.32, -0.45, -0.1, m['timber'])
        K.no_ink(gbox('sand', 0.58, 0.92, 0.3, 0.33, -0.42, -0.13, m['sand']))
    return done(P)


# the card shelf's display slope, in kit space (z toward the front, y up); js/diorama.js seats the cards on it with the same numbers
SLOPE_FRONT, SLOPE_BACK, BOARD = (0.38, 0.76), (-0.32, 1.22), 0.04


def cardshelf():
    """2 x 1: the shop's display shelf. A low cabinet whose top is a slope covered in red baize, a lip along its front for the
    pieces' cards to rest on, cheeks at the ends, a back board with a little shelf of jars and a crown. Symmetric front to back
    (z -0.42 .. 0.42) so the page can place it by its middle."""
    m = mats()
    with Prop('Prop_forge_cardshelf', 0.03) as P:
        (fz, fy), (bz, by) = SLOPE_FRONT, SLOPE_BACK
        L = math.hypot(fz - bz, by - fy); nz, ny = (by - fy) / L, (fz - bz) / L   # the slope's normal, up and toward the front
        gbox('plinth', -0.97, 0.97, 0.0, 0.08, -0.4, 0.42, m['timberdark'])
        extrude_x('body', [(0.36, 0.06), (0.36, fy - 0.02), (bz + 0.02, by - 0.04), (-0.36, by - 0.04), (-0.36, 0.06)], -0.92, 0.92, m['timberdark'])
        plank_row('front', -0.9, 0.9, 0.12, fy - 0.06, 0.36, 0.385, 6, m['timber'], gap=0.025, axis='x')
        extrude_x('baize', [(fz, fy), (bz, by), (bz + nz * BOARD, by + ny * BOARD), (fz + nz * BOARD, fy + ny * BOARD)], -0.92, 0.92, m['cloth'])
        extrude_x('lip', [(0.42, fy - 0.06), (0.42, fy + 0.09), (0.37, fy + 0.09), (0.37, fy - 0.06)], -0.92, 0.92, m['timber'])
        for sx in (-1, 1):
            x0, x1 = (-0.97, -0.92) if sx < 0 else (0.92, 0.97)
            extrude_x('cheek', [(0.42, 0.0), (0.42, fy + 0.12), (bz + 0.1, by + 0.1), (-0.4, by + 0.1), (-0.4, 0.0)], x0, x1, m['timberdark'])
            gbox('cheektop', x0, x1, by + 0.1, 1.82, -0.4, bz + 0.1, m['timberdark'])
        # the back board, its shelf of jars and a box, the crown
        gbox('back', -0.92, 0.92, by - 0.04, 1.82, -0.4, -0.34, m['timber'])
        plank_row('backplanks', -0.92, 0.92, by, 1.8, -0.34, -0.33, 5, m['heartwood'], gap=0.02, axis='x')
        gbox('ledge', -0.92, 0.92, 1.5, 1.54, -0.34, -0.2, m['timberdark'])
        for i, (x, h, g) in enumerate(((-0.7, 0.16, m['ice']), (-0.52, 0.12, m['clay']), (-0.36, 0.18, m['ice']), (0.5, 0.14, m['clay']), (0.7, 0.17, m['ice']))):
            cyl('jar%d' % i, x, -0.27, 1.54, 1.54 + h, 0.05, 0.045, g, seg=8)
        gbox('box', -0.12, 0.14, 1.54, 1.64, -0.32, -0.22, m['hide'])
        gbox('crown', -1.0, 1.0, 1.82, 1.9, -0.42, -0.16, m['timberdark'])
    return done(P)


# the display case's two rows: where each row's cards rest (the bottom of the card, against its lip) and how far back they lean;
# js/diorama.js LAYOUTS has the same numbers
CASE_ROWS, CASE_LEAN = ((0.36, 0.55), (-0.02, 1.24)), math.radians(30)


def cardcase():
    """2 x 1: the shelf made a display case. Two rows of baize, the back row raised on a step so it shows over the front one,
    a lip before each, tall cheeks, a planked back and a crown with a little plaque. Symmetric front to back (z -0.42 .. 0.42)."""
    m = mats()
    with Prop('Prop_forge_cardcase', 0.03) as P:
        uz, uy = -math.sin(CASE_LEAN), math.cos(CASE_LEAN)       # up the baize
        nz, ny = math.cos(CASE_LEAN), math.sin(CASE_LEAN)        # off the baize, toward the front
        B, BACK = 0.04, -0.42
        gbox('plinth', -0.97, 0.97, 0.0, 0.08, BACK, 0.42, m['timberdark'])
        prev = 0.06
        for r, ((pz, py), L) in enumerate(zip(CASE_ROWS, (0.74, 0.7))):
            az, ay = pz - nz * 0.008 - uz * 0.03, py - ny * 0.008 - uy * 0.03          # the baize's top face, just behind the card
            ez, ey = az + uz * L - nz * B, ay + uy * L - ny * B                        # its top end, underneath
            front = 0.34 if r == 0 else pz
            extrude_x('body%d' % r, [(front, prev), (front, py - 0.06), (ez, ey), (BACK, ey), (BACK, prev)], -0.92, 0.92, m['timberdark'])
            extrude_x('baize%d' % r, [(az, ay), (az + uz * L, ay + uy * L), (ez, ey), (az - nz * B, ay - ny * B)], -0.92, 0.92, m['cloth'])
            extrude_x('lip%d' % r, [(pz + 0.06, py - 0.1), (pz + 0.06, py + 0.07), (pz, py + 0.07), (pz, py - 0.1)], -0.92, 0.92, m['timber'])
            prev = ey - 0.02
        plank_row('front', -0.9, 0.9, 0.12, CASE_ROWS[0][1] - 0.12, 0.34, 0.365, 6, m['timber'], gap=0.025, axis='x')
        for sx in (-1, 1):
            x0, x1 = (-0.97, -0.92) if sx < 0 else (0.92, 0.97)
            extrude_x('cheek', [(0.42, 0.0), (0.42, 0.66), (-0.36, 2.0), (BACK, 2.0), (BACK, 0.0)], x0, x1, m['timberdark'])
        gbox('back', -0.92, 0.92, 1.0, 2.0, BACK, -0.37, m['timber'])
        plank_row('backplanks', -0.92, 0.92, 1.6, 1.98, -0.37, -0.36, 5, m['heartwood'], gap=0.02, axis='x')
        gbox('crown', -1.0, 1.0, 2.0, 2.08, BACK, -0.2, m['timberdark'])
        gbox('plaque', -0.24, 0.24, 1.9, 2.0, -0.22, -0.19, m['heartwood'])
        for x in (-0.16, 0.16): cyl('stud', x, -0.185, 1.94, 1.96, 0.012, 0.012, m['bronze'], seg=6)
    return done(P)


# the Hall's plinth: where one piece's card rests (js/diorama.js LAYOUTS plinth: PLINTH_REST, PLINTH_LEAN)
PLINTH_REST, PLINTH_LEAN = (0.12, 1.02), math.radians(40)


def plinth():
    """1 x 1: a stone plinth for the Hall. A stepped base, a fluted column, a cap, and on it a sloped top in red cloth with a little
    bronze lip for one card to rest against. Symmetric front to back."""
    m = mats()
    with Prop('Prop_forge_plinth', 0.03) as P:
        gbox('base1', -0.38, 0.38, 0.0, 0.08, -0.38, 0.38, m['stone'])
        gbox('base2', -0.32, 0.32, 0.08, 0.16, -0.32, 0.32, m['stonelight'])
        cyl('column', 0.0, 0.0, 0.16, 0.82, 0.2, 0.18, m['marble'], seg=12)
        for i in range(6):
            a = i / 6 * math.tau
            K.no_ink(rod('flute%d' % i, (math.cos(a) * 0.19, 0.2, math.sin(a) * 0.19), (math.cos(a) * 0.175, 0.78, math.sin(a) * 0.175), 0.012, 0.012, m['stone'], seg=4))
        gbox('cap', -0.3, 0.3, 0.82, 0.9, -0.3, 0.3, m['stonelight'])
        pz, py = PLINTH_REST
        uz, uy, nz, ny = -math.sin(PLINTH_LEAN), math.cos(PLINTH_LEAN), math.cos(PLINTH_LEAN), math.sin(PLINTH_LEAN)
        az, ay, L, B = pz - nz * 0.008 - uz * 0.03, py - ny * 0.008 - uy * 0.03, 0.42, 0.04
        ez, ey = az + uz * L - nz * B, ay + uy * L - ny * B
        extrude_x('block', [(0.28, 0.9), (0.28, py - 0.04), (ez, ey), (-0.28, ey), (-0.28, 0.9)], -0.28, 0.28, m['stonelight'])
        extrude_x('cloth', [(az, ay), (az + uz * L, ay + uy * L), (ez, ey), (az - nz * B, ay - ny * B)], -0.27, 0.27, m['cloth'])
        extrude_x('lip', [(pz + 0.05, py - 0.06), (pz + 0.05, py + 0.05), (pz, py + 0.05), (pz, py - 0.06)], -0.27, 0.27, m['bronze'])
    return done(P)


os.makedirs(OUT, exist_ok=True)
for name, build in (('Prop_forge_bowbench', bowbench), ('Prop_forge_glass', glassfurnace), ('Prop_forge_cardshelf', cardshelf), ('Prop_forge_cardcase', cardcase), ('Prop_forge_plinth', plinth)):
    K.fresh()
    root, rig = build()
    size = K.export_fbx(root, os.path.join(OUT, name + '.fbx'))
    print('FBX', name, size, 'height', K.height(root), 'tris', K.tris(root))
