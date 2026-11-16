// node tools/glbinfo.mjs file.glb ... : materials (double-sided?) and the model's height in metres, nodes' transforms applied roughly
import fs from 'node:fs';
for (const f of process.argv.slice(2)) {
  const b = fs.readFileSync(f), len = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + len).toString());
  const mats = (j.materials || []).map(m => m.name + (m.doubleSided ? '(2s)' : ''));
  let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  const scaleOf = n => (n.scale || [1, 1, 1]);
  (j.nodes || []).forEach(n => {
    if (n.mesh == null) return;
    const s = scaleOf(n), t = n.translation || [0, 0, 0];
    j.meshes[n.mesh].primitives.forEach(p => { const a = j.accessors[p.attributes.POSITION]; for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], a.min[i] * s[i] + t[i]); hi[i] = Math.max(hi[i], a.max[i] * s[i] + t[i]); } });
  });
  console.log(f.split('/').pop(), 'size', hi.map((h, i) => (h - lo[i]).toFixed(2)).join(' x '), 'y', lo[1].toFixed(2), '..', hi[1].toFixed(2), 'nodes', j.nodes.length, 'rot?', j.nodes.some(n => n.rotation), mats.join(','));
}
