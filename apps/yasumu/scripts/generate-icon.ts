import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { existsSync, mkdirSync, rmSync } from 'node:fs';

const iconsDir = join(import.meta.dirname, '..', 'src-tauri', 'icons');
const iconsetDir = join(iconsDir, 'icon.iconset');
const logo = join(iconsDir, 'logo.png');

interface IconConfig {
  width: number;
  height: number;
  path: string;
}

const genConfig = (
  width: number,
  height: number,
  name?: string,
  ext = 'png',
): IconConfig => {
  return {
    width,
    height,
    path: join(
      iconsDir,
      name
        ? `${name.replaceAll('$w', width.toString()).replaceAll('$h', height.toString())}.${ext}`
        : `${width}x${height}.${ext}`,
    ),
  };
};

const configs: IconConfig[] = [
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

interface IconsetConfig {
  size: number;
  name: string;
}

const iconsetConfigs: IconsetConfig[] = [
  { size: 16, name: 'icon_16x16.png' },
  { size: 32, name: 'icon_16x16@2x.png' },
  { size: 32, name: 'icon_32x32.png' },
  { size: 64, name: 'icon_32x32@2x.png' },
  { size: 128, name: 'icon_128x128.png' },
  { size: 256, name: 'icon_128x128@2x.png' },
  { size: 256, name: 'icon_256x256.png' },
  { size: 512, name: 'icon_256x256@2x.png' },
  { size: 512, name: 'icon_512x512.png' },
  { size: 1024, name: 'icon_512x512@2x.png' },
];

const resizeImage = (width: number, height: number, outputPath: string) => {
  execSync(
    `ffmpeg -loglevel error -i "${logo}" -vf "scale=${width}:${height},format=rgba" -pix_fmt rgba -quality best "${outputPath}" -y`,
  );
};

const generateResizedIcons = () => {
  console.log('Generating resized icons...');

  for (const config of configs) {
    resizeImage(config.width, config.height, config.path);
    console.log(`  Generated ${config.path}`);
  }

  console.log('Resized icons generated successfully.\n');
};

const generateIconset = () => {
  console.log('Generating iconset...');

  if (existsSync(iconsetDir)) {
    rmSync(iconsetDir, { recursive: true });
  }
  mkdirSync(iconsetDir, { recursive: true });

  for (const config of iconsetConfigs) {
    const outputPath = join(iconsetDir, config.name);
    resizeImage(config.size, config.size, outputPath);
    console.log(`  Generated ${config.name}`);
  }

  console.log('Iconset generated successfully.\n');
};

const generateIcns = () => {
  console.log('Generating .icns file...');

  const icnsPath = join(iconsDir, 'icon.icns');
  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);

  console.log(`  Generated ${icnsPath}`);
  console.log('.icns file generated successfully.\n');
};

const main = () => {
  console.log('Starting icon generation...\n');

  generateResizedIcons();
  generateIconset();
  generateIcns();

  console.log('All icons generated successfully!');
};

main();
