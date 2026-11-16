#!/bin/sh
# Rebuild assets/models/*.glb: Darkclay Zero's Blender-built FBX, and our own two station props built with Zero's kit
# (tools/station_props.py). Needs Blender and the DarkclayZERO folder beside this one.
# Then bump ?m= in js/diorama.js so players' browsers fetch the new models.
ZROOT="${ZERO:-$(cd "$(dirname "$0")/../.." && pwd)/DarkclayZERO}"
ZERO_MODELS="$ZROOT/unity/Assets/_Darkclay/Art/Models"
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
OURS="${TMPDIR:-/tmp}/darkclayforge-props"
cd "$(dirname "$0")/.." || exit 1
"$BLENDER" -b -P tools/station_props.py -- "$ZROOT/art-source/blender" "$OURS" 2>&1 | grep -E "^FBX|Error|Traceback"
"$BLENDER" -b -P tools/fbx2glb.py -- "$ZERO_MODELS" assets/models \
  forge=Prop_hearth_forge anvil=Prop_hearth_anvil shelf=Prop_hearth_shelf rack=Prop_hearth_rack counter=Prop_town_desk \
  table=Prop_hearth_table rug=Prop_hearth_rug bench=Prop_town_bench barrels=Prop_dq_barrels crates=World_crates \
  lamp=Prop_dq_lamp candles=Prop_town_candles chest=Prop_dq_chest_small workbench=Prop_hearth_workbench wall=World_dwall \
  stretcher=Prop_hearth_stretcher kettle=Prop_hearth_kettle \
  banner=Prop_hearth_banner armorstand=Prop_dq_armorstand bookshelf=Prop_hearth_bookshelf candlestand=Prop_dq_candlestand \
  brazier=Prop_dq_brazier_tall statue=Prop_dq_statue urn=Prop_dq_urn basket=Prop_hearth_basket flowers=World_flowers \
  sacks=World_sacks herbrail=World_yard_herbrail \
  bowbench="$OURS/Prop_forge_bowbench" glass="$OURS/Prop_forge_glass" \
  folk=Walker_human+Outfit_folk carter=Walker_human+Outfit_carter smith=Walker_human+Outfit_smith \
  chandler=Walker_human+Outfit_chandler bard=Walker_human+Outfit_bard herbalist=Walker_human+Outfit_herbalist \
  dwarf=Walker_dwarf+Outfit_folk 2>&1 | grep -E "^GLB|Error|Traceback"
