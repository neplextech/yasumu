export const REQUEST_SCRIPT_PLACEHOLDER = /* typescript */ `
export function onRequest(ctx: RequestHookContext) {
  const headers = new Headers(ctx.req.headers);
  headers.set('x-custom-header', 'value');
  ctx.setRequest(new Request(ctx.req, { headers }));

  // Returning a standard Response mocks the request and skips the network.
  // return new Response(JSON.stringify({ mocked: true }), {
  //   status: 200,
  //   headers: { 'content-type': 'application/json' },
  // });
}

export async function onResponse(ctx: ResponseHookContext) {
  const body = await ctx.res.clone().json();
  if (body.access_token) {
    ctx.workspace.env.setSecret('access_token', body.access_token);
  }
}

export function onTest(ctx: TestHookContext) {
  test('status should be 200', () => {
    expect(ctx.res.status).toBe(200);
  });
}
`.trim();
