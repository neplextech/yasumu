import './init.ts';

Deno.serve({ port: 8080 }, () => {
  return new Response('Hello, world!');
});
