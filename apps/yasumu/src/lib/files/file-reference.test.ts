import { describe, expect, it } from 'vitest';

import { isYasumuFileReference, registerFileReference } from './file-reference';

describe('browser file references', () => {
  it('uploads selected bytes once and retains only a serializable host handle', async () => {
    const file = new File([new Uint8Array([0, 1, 2])], 'avatar.bin', { type: 'application/octet-stream' });
    const uploads: unknown[] = [];
    const reference = await registerFileReference(file, {
      registerFile(input) {
        uploads.push(input);
        return Promise.resolve({
          id: 'host:file',
          name: input.name,
          mimeType: input.mimeType,
          size: input.bytes.length,
          source: { type: 'host-handle', handleId: 'file' },
        });
      },
    });

    expect(uploads).toEqual([
      {
        name: 'avatar.bin',
        mimeType: 'application/octet-stream',
        bytes: [0, 1, 2],
      },
    ]);
    expect(reference).toEqual({
      id: 'host:file',
      name: 'avatar.bin',
      mimeType: 'application/octet-stream',
      size: 3,
      source: { type: 'host-handle', handleId: 'file' },
    });
    expect(isYasumuFileReference(reference)).toBe(true);
    expect(JSON.parse(JSON.stringify(reference))).toEqual(reference);
    expect(JSON.stringify(reference)).not.toContain('[0,1,2]');
  });

  it('rejects raw files and incomplete objects', () => {
    expect(isYasumuFileReference(new File([], 'raw.txt'))).toBe(false);
    expect(isYasumuFileReference({ id: 'missing-source', name: 'file' })).toBe(false);
  });
});
