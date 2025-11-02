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
  'yasumu-server',
);

await Deno.remove(outputDir, { recursive: true }).catch(Object);

const entrypoints = [join(Deno.cwd(), 'src', 'index.ts')];

const result = await Deno.bundle({
  entrypoints,
  sourcemap: 'inline',
  format: 'esm',
  platform: 'deno',
  minify: true,
  outputDir,
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

// copy prisma directory
await cp(join(Deno.cwd(), 'prisma'), join(outputDir, 'prisma'), {
  recursive: true,
  filter: (source) => !source.endsWith('.db'),
});
