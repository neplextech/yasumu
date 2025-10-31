import { setTimeout as sleep } from 'node:timers/promises';

// // This script is used to keep the worker alive
// const ONE_HOUR = 1000 * 60 * 60;
// setInterval(() => {}, ONE_HOUR);

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
});

setTimeout(async () => {
  const variants = ['success', 'warning', 'error', 'info', 'default'] as const;

  for (const variant of variants) {
    Yasumu.ui.showNotification({
      title: `Notification ${variant}`,
      message: `This is a ${variant} notification from Tanxium runtime`,
      variant,
    });
    await sleep(3_000);
  }
}, 5000);
