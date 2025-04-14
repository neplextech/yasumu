import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir } from 'node:fs/promises';

const ext = process.platform === 'win32' ? '.exe' : '';
const rustInfo = execSync('rustc -vV');
const targetTriple = /host: (\S+)/g.exec(rustInfo)[1];

if (!targetTriple) {
  console.error('Failed to get target triple');
}

const targetDir = `./src-tauri/binaries`;
const targetBin = `${targetDir}/tanxium-${targetTriple}${ext}`;

try {
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  await copyFile(`../../packages/tanxium/dist/tanxium${ext}`, targetBin);
  console.log('Copied tanxium binary successfully!');
} catch (e) {
  console.error('Failed to copy tanxium binary');
  console.error(e);
}
