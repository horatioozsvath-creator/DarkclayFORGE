"""Write js/folk.js from tools/folk.json: each look's height (its walker's, Zero's world.json), the pools and the regulars."""
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); zero = os.path.expanduser(os.environ.get('ZERO', '~/DarkclayZERO'))
d = json.load(open(os.path.join(here, 'folk.json')))
hts = {w['id']: w['height'] for w in json.load(open(os.path.join(zero, 'data/zero/world.json')))['art']['stylized']['walkers']}
looks = {k: hts[v['body']] for k, v in d['looks'].items()}
out = ['// Darkclay Forge. Copyright (c) 2026 the author (github.com/horatioozsvath-creator). All rights reserved: see LICENSE.',
       '// The folk at the counter: written by tools/folk_js.py from tools/folk.json (the pictures are tools/folk.sh\'s). Do not edit by hand.',
       '// LOOKS: each picture\'s height in metres (its people\'s); POOLS: the looks each kind of customer is drawn from; REGULARS: a fixed look by name.',
       'export const LOOKS = ' + json.dumps(looks) + ';',
       'export const POOLS = ' + json.dumps(d['pools']) + ';',
       'export const REGULARS = [' + ', '.join('[/' + p.replace('/', '\\/') + '/, ' + json.dumps(k) + ']' for p, k in d['regulars']) + '];', '']
open(os.path.join(here, '..', 'js', 'folk.js'), 'w').write('\n'.join(out))
print('wrote js/folk.js', len(looks), 'looks')
