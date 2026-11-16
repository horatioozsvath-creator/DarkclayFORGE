#!/bin/sh
# Rebuild assets/models/*.glb from Darkclay Zero's Blender-built FBX (needs Blender and the DarkclayZERO folder beside this one).
# Then bump ?m= in js/diorama.js so players' browsers fetch the new models.
ZERO="${ZERO:-$(cd "$(dirname "$0")/../.." && pwd)/DarkclayZERO}/unity/Assets/_Darkclay/Art/Models"
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
cd "$(dirname "$0")/.." && "$BLENDER" -b -P tools/fbx2glb.py -- "$ZERO" assets/models \
  forge=Prop_hearth_forge anvil=Prop_hearth_anvil shelf=Prop_hearth_shelf rack=Prop_hearth_rack counter=Prop_town_desk \
  table=Prop_hearth_table rug=Prop_hearth_rug bench=Prop_town_bench barrels=Prop_dq_barrels crates=World_crates \
  lamp=Prop_dq_lamp candles=Prop_town_candles chest=Prop_dq_chest_small workbench=Prop_hearth_workbench wall=World_dwall stretcher=Prop_hearth_stretcher bowbench=Prop_bench_meshy kettle=Prop_hearth_kettle \
  folk=Walker_human+Outfit_folk carter=Walker_human+Outfit_carter smith=Walker_human+Outfit_smith \
  chandler=Walker_human+Outfit_chandler bard=Walker_human+Outfit_bard herbalist=Walker_human+Outfit_herbalist \
  dwarf=Walker_dwarf+Outfit_folk 2>&1 | grep -E "^GLB|Error|Traceback"
