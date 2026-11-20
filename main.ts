// NEON LEONIDA — GTA VI trophy guide entry for make.fun (Node 22, standard library only).
//
// The entry itself is the static app in app/ (index.html + app.js + style.css + data/trophies.json):
// a plain offline web app, no build step, no network at runtime. This file is only the delivery
// step: it copies app/ and screenshots/ into the grader's output directory and writes
// /output/dossier.json through the vendored make.fun library, whose bytes the scorer requires
// to be exactly what its own copy of the library writes. vendor/makefun-frontend.ts is left
// untouched for that reason.
//
// Run locally with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The program is deterministic: two runs on the same repo write byte-identical outputs.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) throw new Error('screenshots/ is missing — render the four guide screenshots first');
const shots = readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort();
if (shots.length === 0 || shots.length > 4) throw new Error(`expected 1–4 screenshots, found ${shots.length}`);
for (const shot of shots) {
  const size = statSync(join(shotsDir, shot)).size;
  if (size > 262144) throw new Error(`${shot} is ${size} bytes — over the 256 KiB cap`);
}
if (shots[0] !== '1-roadmap.jpg') throw new Error('the first screenshot must be the roadmap hero (1-roadmap.jpg)');
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the other
// limits refuse an entry the scorer would refuse (more than 4 screenshots or one over 256 KiB;
// more than 993 files/directories in app/ or 48 MiB of app files).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

console.log(`NEON LEONIDA: ${shots.length} screenshots, app/ copied, dossier.json written to ${out}`);
