import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, '..');
const studioDist = path.join(pkgRoot, '../rigour-studio/dist');
const targetDist = path.join(pkgRoot, 'studio-dist');

async function bundle() {
    try {
        console.log(`📦 Bundling Studio from ${studioDist} to ${targetDist}...`);

        if (!await fs.pathExists(studioDist)) {
            console.error('❌ Error: Studio dist folder not found. Run build in rigour-studio first.');
            process.exit(1);
        }

        // Ensure target directory exists and is empty
        await fs.emptyDir(targetDist);

        // Copy contents
        await fs.copy(studioDist, targetDist);

        console.log('✅ Studio bundled successfully.');
    } catch (err) {
        console.error('❌ Bundling failed:', err);
        process.exit(1);
    }
}

bundle();
