import { yasumu } from '../src';
import { describe, test, expect, beforeAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

const testFilePath = path.join(__dirname, 'testFile.txt');
const testDirPath = path.join(__dirname, 'testDir');

describe('FileSystem', () => {
  beforeAll(async () => {
    await fs.writeFile(testFilePath, 'Initial content for testing');
  });

  test('should have a lstat method', async () => {
    const result = await yasumu.fs.lstat(testFilePath);
    expect(result).toBeDefined();
    expect(result.isDirectory).toBe(false);
    expect(result.isFile).toBe(true);
    expect(result.isSymlink).toBe(false);
    expect(result.size).toBe(27);
  });

  test('should have a copyFile method', async () => {
    const copyPath = path.join(__dirname, 'copyFile.txt');
    await yasumu.fs.copyFile(testFilePath, copyPath);
    expect(fs.readFile(copyPath, { encoding: 'utf-8' })).resolves.toBe(
      'Initial content for testing',
    );
    yasumu.fs.remove(copyPath);
  });

  test('should have an exists method', () => {
    expect(yasumu.fs.exists(testFilePath)).resolves.toBe(true);
  });

  test('should have a mkdir method', async () => {
    await yasumu.fs.mkdir(testDirPath);
    const exists = await yasumu.fs.exists(testDirPath);
    expect(exists).toBe(true);

    const stats = await yasumu.fs.lstat(testDirPath);
    expect(stats.isDirectory).toBe(true);
  });

  test('should have a readDir method', async () => {
    const file1 = path.join(testDirPath, 'file1.txt');
    await fs.writeFile(file1, 'File 1 content');
    const entries = await yasumu.fs.readDir(testDirPath);
    const entryNames = entries.map((entry) => entry.name);

    expect(entries).toBeDefined();
    expect(Array.isArray(entries)).toBe(true);
    expect(entryNames).toContain('file1.txt');
  });

  test('should have a readFile method', async () => {
    const result = await yasumu.fs.readFile(testFilePath);
    expect(result).toBe('Initial content for testing');
  });

  test('should have a remove method', async () => {
    await yasumu.fs.remove(testFilePath);
    const result = await yasumu.fs.exists(testFilePath);
    expect(result).toBe(false);
  });

  test('should have a writeFile method', () => {
    expect(yasumu.fs.writeFile).toBeDefined();
  });

  test('should have a watch method', () => {
    expect(yasumu.fs.watch).toBeDefined();
  });
});
