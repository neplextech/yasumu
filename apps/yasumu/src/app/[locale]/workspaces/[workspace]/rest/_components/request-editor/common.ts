export const REQUEST_SCRIPT_PLACEHOLDER = `
export function onRequest(req: YasumuRequest) {
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

export function onTest(req: YasumuRequest, res: YasumuResponse) {
  // Test assertions
  test('status should be 200', () => {
    expect(res.status).toBe(200);
  });
}
`.trim();
