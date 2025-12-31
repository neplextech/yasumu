export const REQUEST_SCRIPT_PLACEHOLDER = `
function onRequest(req: YasumuRequest) {
  // Modify request headers, body, etc.
  req.headers.set('X-Custom-Header', 'value');
  // Return a response object to show fake response data
  return new YasumuResponse('Hello, world!', { status: 200 });
}
export function onResponse(req: YasumuRequest, res: YasumuResponse) {
  // Process response data. Eg: save \`access_token\` to the environment
  const body = res.json();

  if (body.access_token) {
    res.env.setSecret('access_token', body.access_token);
  }
}
`.trim();

export const TEST_SCRIPT_PLACEHOLDER = `
// Test assertions
// Write tests to validate response data

test('status should be 200', (ctx: TestContext) => {
  expect(ctx.response.status).toBe(200);
});

test('should return user data', (ctx: TestContext) => {
  const body = ctx.response.json();
  expect(body.id).toBeDefined();
  expect(body.name).toBeString();
});
`.trim();
