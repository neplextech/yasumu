import { join } from 'node:path';
import { cp } from 'node:fs/promises';

const outputDir = join(
  Deno.cwd(),
  '..',
  '..',
  'apps',
  'yasumu',
  'src-tauri',
  'resources',
  'yasumu-scripts',
  'public-modules',
  'yasumu__test',
);

await Deno.remove(outputDir, { recursive: true }).catch(Object);

const result = await Deno.bundle({
  entrypoints: ['./src/index.ts'],
  outputPath: './dist/index.js',
  format: 'esm',
  platform: 'deno',
  sourcemap: 'inline',
  minify: true,
  packages: 'bundle',
  external: [],
});

if (result.errors.length > 0) {
  console.error(result.errors.map((e) => e.text).join('\n'));
}

if (result.warnings.length > 0) {
  console.warn(result.warnings.map((w) => w.text).join('\n'));
}

if (result.success) {
  console.log('Bundle successful');
}

if (result.outputFiles) {
  console.log(
    result.outputFiles
      .map((file) => {
        return `${file.path} - ${file.hash}`;
      })
      .join('\n'),
  );
}

await cp(join(Deno.cwd(), 'dist'), outputDir, { recursive: true });
