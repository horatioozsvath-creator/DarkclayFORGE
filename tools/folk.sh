#!/bin/sh
# The folk at the counter: render every look in tools/folk.json (or the ones named) to assets/folk/<id>.webp.
#   ZERO=~/DarkclayZERO tools/folk.sh [look ...]
cd "$(dirname "$0")/.." || exit 1
B=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
LOOKS=${*:-$(python3 -c "import json;print(' '.join(json.load(open('tools/folk.json'))['looks']))")}
for k in $LOOKS; do
  "$B" -b -P tools/folk.py -- "$k" "$PWD/assets/folk/$k.webp" 2>&1 | grep -E "FOLK|NOFIT|Error|Traceback" || echo "FAILED $k"
done
python3 tools/folk_js.py
