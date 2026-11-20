// Leonida Trophy Atlas: the hand-in program (Node 22, standard library only).
//
// The atlas is plain static files in app/: index.html, style.css, app.js and
// data/trophies.json. It opens in any browser from a static server with app/
// at the root, and it loads nothing over the network.
//
// This program hands the atlas in. It copies app/ and screenshots/ from
// beside this file into the output directory and writes dossier.json there,
// using the vendored make.fun library (vendor/makefun-frontend.ts, unchanged:
// the scorer rebuilds the dossier with its own copy and compares the two
// byte for byte, so that file must stay exactly as the kit shipped it).
//
// Run it locally like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output. The program
// runs twice in the grader and both runs must write the same bytes, so it
// does nothing time dependent: same input files, same output bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Caps from the scorer: at most 4 screenshots, each at most 256 KiB; app/
// at most 993 files and directories and 48 MiB in all. text_max_bytes shapes
// how much source the dossier's text carries (160 KiB).
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
console.log('wrote ' + dossierPath);
