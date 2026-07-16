import { beforeEach, describe, expect, it, vi } from 'vitest';

const { tauriFetch } = vi.hoisted(() => ({ tauriFetch: vi.fn() }));

vi.mock('@tauri-apps/plugin-http', () => ({ fetch: tauriFetch }));

import { executeGraphqlRequest, GraphqlRequestController } from './graphql-request';

const requestOptions = {
  url: 'https://example.com/graphql',
  query: 'query Test { test }',
  variables: null,
  operationName: 'Test',
  headers: {},
  echoServerPort: null,
  interpolate: (value: string) => value,
};

describe('GraphqlRequestController', () => {
  beforeEach(() => tauriFetch.mockReset());

  it('does not let an older request clear the active controller', async () => {
    let resolveFirst!: (response: Response) => void;
    let resolveSecond!: (response: Response) => void;
    tauriFetch
      .mockImplementationOnce(() => new Promise<Response>((resolve) => (resolveFirst = resolve)))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => (resolveSecond = resolve)));

    const controller = new GraphqlRequestController();
    const firstRequest = controller.execute(requestOptions);
    const secondRequest = controller.execute(requestOptions);

    resolveFirst(new Response('{"data":{"test":true}}', { headers: { 'content-type': 'application/json' } }));
    await firstRequest;

    expect(controller.isActive).toBe(true);
    controller.cancel();
    expect(controller.isActive).toBe(false);

    resolveSecond(new Response('{"data":{"test":true}}', { headers: { 'content-type': 'application/json' } }));
    await secondRequest;
  });
});

describe('executeGraphqlRequest', () => {
  beforeEach(() => tauriFetch.mockReset());

  it('rejects malformed variables before sending a request', async () => {
    const outcome = await executeGraphqlRequest({
      ...requestOptions,
      variables: '{not-json}',
    });

    expect(outcome).toEqual({ response: null, error: 'GraphQL variables contain invalid JSON' });
    expect(tauriFetch).not.toHaveBeenCalled();
  });

  it('rejects non-object variables before sending a request', async () => {
    const outcome = await executeGraphqlRequest({
      ...requestOptions,
      variables: '["not", "an", "object"]',
    });

    expect(outcome).toEqual({ response: null, error: 'GraphQL variables must be a JSON object' });
    expect(tauriFetch).not.toHaveBeenCalled();
  });

  it('keeps only structurally valid GraphQL errors', async () => {
    tauriFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: null,
          errors: [{ message: 'Nope', locations: [{ line: 1, column: 2 }], path: ['viewer', 0] }],
        }),
        { headers: { 'content-type': 'application/json' } },
      ),
    );

    const validOutcome = await executeGraphqlRequest(requestOptions);
    expect(validOutcome.response?.errors).toEqual([
      { message: 'Nope', locations: [{ line: 1, column: 2 }], path: ['viewer', 0] },
    ]);

    tauriFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: null, errors: [{ message: 42 }] }), {
        headers: { 'content-type': 'application/json' },
      }),
    );

    const invalidOutcome = await executeGraphqlRequest(requestOptions);
    expect(invalidOutcome.response?.errors).toBeNull();
  });
});
