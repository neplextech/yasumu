export const GRAPHQL_SCRIPT_PLACEHOLDER = `// Modify request before sending
export function onRequest(req) {
  // Add authentication header
  req.headers['Authorization'] = 'Bearer ' + env.get('API_TOKEN');
  
  // Modify variables
  if (req.variables) {
    req.variables.timestamp = Date.now();
  }
  
  return req;
}

// Process response after receiving
export function onResponse(req, res) {
  // Log response data
  console.log('Response:', res.data);
  
  // Check for GraphQL errors
  if (res.errors && res.errors.length > 0) {
    console.error('GraphQL Errors:', res.errors);
  }
}

// Define tests
export function onTest(req, res) {
  test('Response should have data', () => {
    expect(res.data).toBeDefined();
  });
  
  test('Response status should be 200', () => {
    expect(res.status).toBe(200);
  });
}`;
