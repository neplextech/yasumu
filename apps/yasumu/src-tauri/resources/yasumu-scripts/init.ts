import './test.tsx';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

Yasumu.onEvent(async (event) => {
  console.log('[YasumuScript] Received event from renderer/frontend:', event);

  const response = execSync('node -e "console.log(\'Hello, world!\')"');
  console.log('Node command response: ', response.toString());

  const randomTodo = await fetch(
    'https://jsonplaceholder.typicode.com/todos/1',
  );
  const todo = await randomTodo.json();
  console.log('Random todo:', todo);

  await Yasumu.ui.showNotification({
    title: 'Random Todo Fetched',
    message: `${todo.title}`,
    variant: 'info',
  });

  const FILE_PATH = join(import.meta.dirname!, 'file_1.txt');

  const worker = new Worker(new URL('./worker.ts', import.meta.url).href, {
    type: 'module',
  });

  worker.postMessage({
    filename: FILE_PATH,
  });
});
