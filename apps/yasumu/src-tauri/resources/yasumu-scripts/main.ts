Yasumu.onEvent(async (event) => {
  console.log('[YasumuScript] Received event from renderer/frontend:', event);

  const randomTodo = await fetch(
    'https://jsonplaceholder.typicode.com/todos/1',
  );
  const todo = await randomTodo.json();
  console.log('Random todo:', todo);

  Yasumu.ui.showNotification({
    title: 'Random Todo Fetched',
    message: `${todo.title}`,
    variant: 'info',
  });

  const FILE_PATH =
    '/Users/andromeda/Developer/work/neplex/yasumu/apps/yasumu/src-tauri/resources/yasumu-scripts/file_1.txt';

  const worker = new Worker(new URL('./worker.ts', import.meta.url).href, {
    type: 'module',
    deno: {
      permissions: {
        read: [new URL(FILE_PATH, import.meta.url)],
      },
    },
  });

  worker.postMessage({
    filename: new URL(FILE_PATH, import.meta.url).href,
  });
});
