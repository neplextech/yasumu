import { describe, expect, it, vi } from 'vitest';

import { snapshotResponse } from '../src/serialization.js';

describe('body snapshots', () => {
  it('streams the body while retaining only the configured prefix', async () => {
    const arrayBuffer = vi.spyOn(Response.prototype, 'arrayBuffer');
    const response = new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('first-'));
          controller.enqueue(new TextEncoder().encode('second'));
          controller.close();
        },
      }),
      { headers: { 'content-type': 'text/plain' } },
    );

    const snapshot = await snapshotResponse(response, 8);

    expect(arrayBuffer).not.toHaveBeenCalled();
    expect(snapshot.body).toEqual({
      kind: 'text',
      text: 'first-se',
      size: 12,
      truncated: true,
      contentType: 'text/plain',
    });
    arrayBuffer.mockRestore();
  });

  it('reports a zero-byte retained body without buffering the source', async () => {
    const snapshot = await snapshotResponse(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { 'content-type': 'application/octet-stream' },
      }),
      0,
    );

    expect(snapshot.body).toEqual({
      kind: 'binary',
      bytes: [],
      size: 3,
      truncated: true,
      contentType: 'application/octet-stream',
    });
  });
});
