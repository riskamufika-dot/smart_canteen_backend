'use strict';

/**
 * Copies all non-TypeScript assets (schema.json, component .json files)
 * from src/ into dist/ after TypeScript compilation.
 *
 * Required because tsc only compiles .ts files and does not copy .json assets,
 * but Strapi's runtime loader reads schema.json files directly from dist/.
 */

const path = require('path');
const fse = require('fs-extra');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const distSrcDir = path.join(root, 'dist', 'src');

async function copySchemas() {
  // Copy all JSON files from src/ to dist/src/, preserving directory structure
  const srcFiles = await collectJsonFiles(srcDir);

  for (const srcFile of srcFiles) {
    const relative = path.relative(srcDir, srcFile);
    const destFile = path.join(distSrcDir, relative);
    await fse.ensureDir(path.dirname(destFile));
    await fse.copy(srcFile, destFile, { overwrite: true });
  }

  console.log(`[copy-schemas] Copied ${srcFiles.length} JSON file(s) to dist/src/`);
}

async function collectJsonFiles(dir) {
  const results = [];
  if (!await fse.pathExists(dir)) return results;

  const entries = await fse.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await collectJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

copySchemas().catch((err) => {
  console.error('[copy-schemas] Error:', err.message);
  process.exit(1);
});
