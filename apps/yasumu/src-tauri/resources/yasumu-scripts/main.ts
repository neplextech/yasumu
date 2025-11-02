setTimeout(() => {
  Deno.serve({ port: 8080 }, () => {
    return new Response('Hello, world!');
  });
}, 3000);
