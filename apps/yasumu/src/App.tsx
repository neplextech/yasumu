import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { FaSpinner, FaStop, FaPlay } from 'react-icons/fa';
import { LuTriangleAlert, LuBan } from 'react-icons/lu';
import { nanoid } from './lib/nanoid';

type Task = {
  id: string;
  code: string;
  state:
    | 'running'
    | 'completed'
    | 'error'
    | 'stopped'
    | 'stopping'
    | 'waiting_for_permission';
  result?: Record<string, any>;
  error?: string;
  permissionPrompt?: PermissionPrompt;
  permissionHistory?: PermissionPrompt[];
};

type PermissionsResponse = 'Allow' | 'Deny' | 'AllowAll';

type PermissionPrompt = {
  name: string;
  api_name: string | undefined;
  message: string;
  is_unary: boolean;
};

type InternalTask = {
  id: string;
  state:
    | 'running'
    | 'completed'
    | 'error'
    | 'stopping'
    | 'stopped'
    | 'waiting_for_permission';
  return_value?: string;
  error?: string;
  permission_prompt?: PermissionPrompt;
  permission_history?: PermissionPrompt[];
};

const eventTarget = new EventTarget();

await listen<InternalTask>('task-state-changed', (event) => {
  eventTarget.dispatchEvent(
    new CustomEvent('task-state-changed', { detail: event.payload }),
  );
});

const initialCode = `import * as cowsay from "https://esm.sh/cowsay@1.6.0"

console.log("-- taskId", RuntimeExtension.taskId)

// fetch a random user name from an example json api
const randomUserId = Math.floor(Math.random() * 10) + 1
const user = await fetch(\`https://jsonplaceholder.typicode.com/users/\${randomUserId}\`).then(r => r.json())

const text = cowsay.say({
  text: \`Hey \${user.name}! 🤠 (taskId: \${RuntimeExtension.taskId})\`,
})

console.log(text)

// get a post

const post = await fetch("https://jsonplaceholder.typicode.com/posts/1").then(r => r.json())

console.log("post", post)

// write it to a file on the desktop by path

const path = RuntimeExtension.documentDir()

console.log("path", path)

await Deno.writeTextFile(\`\${path}/post.json\`, JSON.stringify({
  text,
  post,
}))

console.log("done")

// wait 5 seconds
await new Promise((resolve) => setTimeout(resolve, 5000))

RuntimeExtension.returnValue({ text, post })
`;

function App() {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<Record<string, any> | undefined>();
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleTaskStateChanged = useCallback((event: Event) => {
    const task = (event as CustomEvent<InternalTask>).detail;

    console.log('-- task state changed', task);

    let result: Record<string, any> | undefined;

    if (task.return_value) {
      result = JSON.parse(task.return_value);
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              state: task.state,
              result,
              error: task.error,
              permissionPrompt: task.permission_prompt,
              permissionHistory: task.permission_history,
            }
          : t,
      ),
    );

    if (task.state === 'completed') {
      setResult(result);
    }
  }, []);

  useEffect(() => {
    eventTarget.addEventListener('task-state-changed', handleTaskStateChanged);

    return () => {
      eventTarget.removeEventListener(
        'task-state-changed',
        handleTaskStateChanged,
      );
    };
  }, [handleTaskStateChanged]);

  const handleRunCode = async (codeToRun?: string) => {
    const newTaskId = nanoid();
    const newTask: Task = {
      id: newTaskId,
      code: codeToRun || code,
      state: 'running',
    };

    try {
      setTasks((prev) => [...prev, newTask]);

      console.log('-- running code', newTaskId);

      await invoke('run_task', {
        taskId: newTaskId,
        code: codeToRun || code,
      });
    } catch (error) {
      console.error('Failed to run code:', error);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === newTaskId ? { ...t, state: 'error', result: { error } } : t,
        ),
      );
    }
  };

  const handleReplayTask = async (task: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, state: 'running' } : t)),
    );

    try {
      await invoke('run_task', {
        taskId: task.id,
        code: task.code,
      });
    } catch (error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, state: 'error', result: { error } } : t,
        ),
      );
    }
  };

  const handleStopTask = async (taskId: string) => {
    try {
      await invoke('stop_task', { taskId });
    } catch (error) {
      console.error('Failed to stop task:', error);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, state: 'error', result: { error } } : t,
        ),
      );
    }
  };

  const handlePermissionResponse = async (
    taskId: string,
    response: PermissionsResponse,
  ) => {
    try {
      await invoke('respond_to_permission_prompt', { taskId, response });
    } catch (error) {
      console.error('Failed to respond to permission:', error);
    }
  };

  const handleClearCompletedTasks = () => {
    setTasks((prev) =>
      prev.filter(
        (t) =>
          t.state === 'running' ||
          t.state === 'stopping' ||
          t.state === 'waiting_for_permission',
      ),
    );
    invoke('clear_completed_tasks');
  };

  const isAnyTaskWaitingForPermissions = tasks.some(
    (t) => t.state === 'waiting_for_permission',
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 p-4">
            <h1 className="text-xl font-medium text-gray-900">Code Runner</h1>
          </div>

          <div className="flex flex-col gap-4 p-4">
            <CodeMirror
              value={code}
              height="200px"
              extensions={[javascript({ jsx: true })]}
              onChange={(value) => setCode(value)}
            />
            <button
              onClick={() => handleRunCode()}
              className="w-fit bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Run Code
            </button>
            {isAnyTaskWaitingForPermissions && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                <LuTriangleAlert className="shrink-0 w-5 h-5" />
                <span>
                  There are pending permission requests. Keep in mind that it
                  could block some tasks that need permissions due to a
                  `deno_runtime` limitation. Resolve them to avoid blocking
                  other tasks. See the README for more details.
                </span>
              </div>
            )}
            {tasks.length > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-medium text-gray-900">Runs:</h2>
                  <button
                    onClick={handleClearCompletedTasks}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear Completed
                  </button>
                </div>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{task.id}</span>
                          {task.state === 'running' && (
                            <>
                              <FaSpinner className="animate-spin text-blue-500" />
                              <button
                                onClick={() => handleStopTask(task.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <FaStop />
                              </button>
                            </>
                          )}
                          {task.state === 'stopping' && (
                            <>
                              <FaSpinner className="animate-spin text-yellow-500" />
                              <span className="text-yellow-500 text-sm">
                                Stopping...
                              </span>
                            </>
                          )}
                          {![
                            'running',
                            'stopping',
                            'waiting_for_permission',
                          ].includes(task.state) && (
                            <button
                              onClick={() => handleReplayTask(task)}
                              className="text-green-500 hover:text-green-600"
                              title="Replay this task"
                            >
                              <FaPlay />
                            </button>
                          )}
                        </div>
                        <span
                          className={`text-sm ${
                            task.state === 'completed'
                              ? 'text-green-500'
                              : task.state === 'error'
                                ? 'text-red-500'
                                : task.state === 'stopped'
                                  ? 'text-yellow-500'
                                  : task.state === 'stopping'
                                    ? 'text-yellow-500'
                                    : task.state === 'waiting_for_permission'
                                      ? 'text-orange-500'
                                      : 'text-blue-500'
                          }`}
                        >
                          {task.state}
                        </span>
                      </div>
                      {task.state === 'waiting_for_permission' &&
                        task.permissionPrompt && (
                          <div className="mb-3 bg-orange-50 border border-orange-200 p-3 rounded-md">
                            <p className="text-sm text-orange-700 mb-2">
                              {task.permissionPrompt.message}
                            </p>
                            <div className="text-sm text-orange-700 mb-2">
                              <div>Name: {task.permissionPrompt.name}</div>
                              <div>API: {task.permissionPrompt.api_name}</div>
                              <div>
                                Unary:{' '}
                                {task.permissionPrompt.is_unary ? 'Yes' : 'No'}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handlePermissionResponse(task.id, 'Allow')
                                }
                                className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded inline-flex items-center gap-1"
                              >
                                <FaPlay className="text-xs" />
                                Allow
                              </button>
                              <button
                                onClick={() =>
                                  handlePermissionResponse(task.id, 'Deny')
                                }
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm py-1 px-3 rounded inline-flex items-center gap-1"
                              >
                                <LuBan className="text-xs" />
                                Deny
                              </button>
                              {task.permissionPrompt.is_unary && (
                                <button
                                  onClick={() =>
                                    handlePermissionResponse(
                                      task.id,
                                      'AllowAll',
                                    )
                                  }
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm py-1 px-3 rounded inline-flex items-center gap-1"
                                >
                                  <FaPlay className="text-xs" />
                                  Allow All
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      {task.error ? (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-md font-mono text-sm overflow-auto max-h-64 whitespace-pre-wrap text-red-600">
                          {task.error}
                        </div>
                      ) : (
                        task.result && (
                          <div className="bg-gray-50 p-3 rounded-md font-mono text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                            {task.result.text ||
                              ((task.state === 'stopped' ||
                                task.state === 'stopping') &&
                                'Task is being stopped...')}
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <div className="mt-4">
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Latest Result:
                </h2>
                <div className="bg-gray-50 p-3 rounded-md font-mono text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                  {result.text}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
