import { execSync } from 'node:child_process';
import { join } from 'node:path';

const path = join(import.meta.dirname, '..', 'src-tauri', 'icons');
const logo = join(path, 'logo.png');

const genConfig = (
  width: number,
  height: number,
  name?: string,
  ext = 'png',
) => {
  return {
    width,
    height,
    path: join(
      path,
      name
        ? `${name.replaceAll('$w', width.toString()).replaceAll('$h', height.toString())}.${ext}`
        : `${width}x${height}.${ext}`,
    ),
  };
};

const configs = [
  genConfig(32, 32),
  genConfig(128, 128),
  genConfig(256, 256, '128x128@2x'),
  genConfig(256, 256, 'icon', 'ico'),
  genConfig(512, 512, 'icon'),
  genConfig(30, 30, 'Square$wx$hLogo'),
  genConfig(44, 44, 'Square$wx$hLogo'),
  genConfig(71, 71, 'Square$wx$hLogo'),
  genConfig(89, 89, 'Square$wx$hLogo'),
  genConfig(107, 107, 'Square$wx$hLogo'),
  genConfig(142, 142, 'Square$wx$hLogo'),
  genConfig(150, 150, 'Square$wx$hLogo'),
  genConfig(284, 284, 'Square$wx$hLogo'),
  genConfig(310, 310, 'Square$wx$hLogo'),
  genConfig(50, 50, 'StoreLogo'),
];

for (const config of configs) {
  execSync(
    `ffmpeg -loglevel error -i ${logo} -vf "scale=${config.width}:${config.height},format=rgba" -pix_fmt rgba -quality best ${config.path} -y`,
  );
  console.log(`Generated ${config.path}`);
}
