export const GRAPHQL_SCRIPT_PLACEHOLDER = `// Modify a standard Web Request before sending.
export async function onRequest(ctx: RequestHookContext) {
  const payload = await ctx.req.clone().json();
  const headers = new Headers(ctx.req.headers);
  headers.set('authorization', 'Bearer ' + ctx.workspace.env.getSecret('API_TOKEN'));
  payload.variables = { ...payload.variables, timestamp: Date.now() };

  ctx.setRequest(new Request(ctx.req, {
    headers,
    body: JSON.stringify(payload),
  }));
}

export async function onResponse(ctx: ResponseHookContext) {
  const payload = await ctx.res.clone().json();
  console.log('Response:', payload.data);
  if (payload.errors?.length) console.error('GraphQL Errors:', payload.errors);
}

export async function onTest(ctx: TestHookContext) {
  const payload = await ctx.res.clone().json();
  test('Response should have data', () => {
    expect(payload.data).toBeDefined();
  });
  test('Response status should be 200', () => {
    expect(ctx.res.status).toBe(200);
  });
}`;
