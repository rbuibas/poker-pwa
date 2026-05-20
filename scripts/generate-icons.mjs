// Rasterize static/icon.svg to PNGs for the PWA manifest.
// Run with: node scripts/generate-icons.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'static', 'icon.svg');

const targets = [
	{ out: 'icon-192.png', size: 192, padding: 0 },
	{ out: 'icon-512.png', size: 512, padding: 0 },
	// Maskable icon — needs a safe zone (≥10% padding all around).
	{ out: 'icon-512-maskable.png', size: 512, padding: 64 },
	{ out: 'favicon.png', size: 64, padding: 0 }
];

const svg = await readFile(src);

for (const { out, size, padding } of targets) {
	const inner = size - padding * 2;
	const buf = await sharp(svg, { density: 512 })
		.resize(inner, inner)
		.extend({
			top: padding,
			bottom: padding,
			left: padding,
			right: padding,
			background: { r: 15, g: 26, b: 15, alpha: 1 }
		})
		.png()
		.toBuffer();
	const dest = path.join(root, 'static', out);
	await writeFile(dest, buf);
	console.log(`wrote ${dest} (${size}x${size})`);
}
