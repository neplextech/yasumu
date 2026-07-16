import { snapshotRequest, snapshotResponse } from "../src/serialization.ts";
import type {
  RuntimeHostCallHandler,
  ScriptHookInvocation,
  ScriptSource,
  WorkspaceEmail,
  YasumuRuntimeSession,
  YasumuScriptRuntime,
} from "../src/types.ts";

const workspace = {
  id: "workspace-1",
  name: "Workspace",
  root: ".",
};

let executionSequence = 0;

export interface RuntimeConformanceFactory {
  readonly kind: string;
  create(options?: { defaultTimeoutMs?: number }): YasumuScriptRuntime;
}

export interface RuntimeConformanceCase {
  readonly name: string;
  run(factory: RuntimeConformanceFactory): Promise<void>;
}

export const runtimeConformanceCases: readonly RuntimeConformanceCase[] = [
  {
    name:
      "standard Request and Response contexts, entity identity, TypeScript, mocks, and logs",
    async run(factory) {
      await withSession(factory, async (session) => {
        const result = await session.invokeHook(
          await invocation(
            "onRequest",
            `
              interface Payload { value: number }
              export async function onRequest(ctx: {
                id: string;
                entity: { id: string };
                req: Request;
                setRequest(request: Request): void;
              }) {
                const payload = await ctx.req.json() as Payload;
                if (ctx.id !== ctx.entity.id) throw new Error('context id must identify the entity');
                console.info('request value', payload.value);
                ctx.setRequest(new Request(ctx.req.url + '?changed=1', {
                  method: ctx.req.method,
                  headers: ctx.req.headers,
                  body: JSON.stringify(payload),
                }));
                return new Response(JSON.stringify({ doubled: payload.value * 2, contextId: ctx.id }), {
                  status: 201,
                  headers: { 'content-type': 'application/json' },
                });
              }
            `,
          ),
        );

        equal(
          result.request?.url,
          "https://example.test/request?changed=1",
          "mutated request URL",
        );
        equal(result.mockResponse?.status, 201, "mock response status");
        matches(
          result.mockResponse?.body,
          { kind: "json", value: { doubled: 6, contextId: "entity-1" } },
          "mock response body",
        );
        equal(result.logs[0]?.level, "info", "log level");
        equal(result.logs[0]?.message, "request value 3", "formatted log");
        matches(
          result.logs[0]?.data,
          ["request value", 3],
          "structured log data",
        );
      });
    },
  },
  {
    name:
      "setRequest rejects consumed standard Request bodies deterministically",
    async run(factory) {
      await withSession(factory, async (session) => {
        await rejectsWith(
          session.invokeHook(
            await invocation(
              "onRequest",
              `
                export async function onRequest(ctx) {
                  const consumed = new Request('https://example.test/consumed', {
                    method: 'POST',
                    body: 'already read',
                  });
                  await consumed.text();
                  ctx.setRequest(consumed);
                }
              `,
            ),
          ),
          {
            code: "SCRIPT_INVALID_REQUEST",
            message: "setRequest requires an unconsumed standard Request",
          },
        );
      });
    },
  },
  {
    name:
      "large request and response bodies reach hooks and consumed requests are restored untruncated",
    async run(factory) {
      await withSession(factory, async (session) => {
        const requestBody = "r".repeat(1024 * 1024 + 257);
        const responseBody = "s".repeat(1024 * 1024 + 513);
        const hookInvocation = await invocation(
          "onResponse",
          `
            import { env } from 'yasumu:env';
            export async function onResponse(ctx) {
              const requestBody = await ctx.req.text();
              const responseBody = await ctx.res.text();
              env.setVariable('requestLength', requestBody.length);
              env.setVariable('responseLength', responseBody.length);
            }
          `,
        );
        hookInvocation.request = await snapshotRequest(
          new Request("https://example.test/large", {
            method: "POST",
            headers: { "content-type": "text/plain" },
            body: requestBody,
          }),
          Number.POSITIVE_INFINITY,
        );
        hookInvocation.response = await snapshotResponse(
          new Response(responseBody, {
            headers: { "content-type": "text/plain" },
          }),
          Number.POSITIVE_INFINITY,
        );

        const result = await session.invokeHook(hookInvocation);
        equal(
          result.environment.variables.requestLength,
          requestBody.length,
          "large request hook length",
        );
        equal(
          result.environment.variables.responseLength,
          responseBody.length,
          "large response hook length",
        );
        equal(
          result.request?.body.kind,
          "text",
          "restored large request body kind",
        );
        if (result.request?.body.kind !== "text") return;
        equal(
          result.request.body.text.length,
          requestBody.length,
          "restored large request body length",
        );
        equal(
          result.request.body.truncated,
          false,
          "restored large request truncation",
        );
      });
    },
  },
  {
    name: "persistent module state and execution-local environment snapshots",
    async run(factory) {
      await withSession(factory, async (session) => {
        const code = `
          import { env } from 'yasumu:env';
          let calls: number = 0;
          export function onRequest() {
            calls += 1;
            const inherited = env.getVariable('mutated') ?? 'clean';
            env.setVariable('mutated', calls);
            return new Response(JSON.stringify({ calls, inherited }), {
              headers: { 'content-type': 'application/json' },
            });
          }
        `;
        const first = await session.invokeHook(
          await invocation("onRequest", code, {
            sourceId: "persistent-script",
          }),
        );
        const second = await session.invokeHook(
          await invocation("onRequest", code, {
            sourceId: "persistent-script",
          }),
        );

        matches(
          first.mockResponse?.body,
          { kind: "json", value: { calls: 1, inherited: "clean" } },
          "first persistent result",
        );
        matches(
          second.mockResponse?.body,
          { kind: "json", value: { calls: 2, inherited: "clean" } },
          "second persistent result",
        );
        equal(
          first.environment.variables.mutated,
          1,
          "first environment mutation",
        );
        equal(
          second.environment.variables.mutated,
          2,
          "second environment mutation",
        );
      });
    },
  },
  {
    name: "workspace virtual module and every host-call-backed script API",
    async run(factory) {
      const methods: string[] = [];
      let emailIndex = 0;
      const matchingEmail = email("email-2", "match");
      const hostCall: RuntimeHostCallHandler = async (method) => {
        methods.push(method);
        switch (method) {
          case "entity.get":
            return { id: "nested", name: "Nested", kind: "rest" } as never;
          case "entity.list":
            return [{ id: "nested", name: "Nested", kind: "rest" }] as never;
          case "entity.execute":
            return {
              executionId: "child",
              entityId: "nested",
              status: "completed",
              tests: [],
              logs: [],
              diagnostics: [],
            } as never;
          case "email.list":
            return { emails: [matchingEmail], cursor: "list-cursor" } as never;
          case "email.next":
            emailIndex += 1;
            return {
              email: emailIndex === 1
                ? email("email-1", "ignore")
                : matchingEmail,
              cursor: `cursor-${emailIndex}`,
            } as never;
          case "file.resolve":
            return {
              id: "file-1",
              name: "fixture.txt",
              mimeType: "text/plain",
              size: 7,
              source: { type: "workspace-path", path: "fixture.txt" },
              resolvedPath: "/virtual/fixture.txt",
            } as never;
          case "file.open":
            return {
              file: {
                id: "file-1",
                name: "fixture.txt",
                mimeType: "text/plain",
                size: 7,
                source: { type: "workspace-path", path: "fixture.txt" },
                resolvedPath: "/virtual/fixture.txt",
              },
              bytes: [...new TextEncoder().encode("fixture")],
            } as never;
          case "permission.request":
            return { granted: true } as never;
        }
      };
      const workspaceModule: ScriptSource = {
        id: "workspace-module",
        code: `
          export const sharedPrefix: string = 'shared';
          export function decorate(value: string): string { return sharedPrefix + ':' + value; }
        `,
      };

      await withSession(
        factory,
        async (session) => {
          const result = await session.invokeHook(
            await invocation(
              "onRequest",
              `
                import { decorate, workspace } from 'yasumu:workspace';
                import { runtime } from 'yasumu:runtime';
                import { env } from 'yasumu:env';
                import { files } from 'yasumu:files';

                export async function onRequest() {
                  const entity = await workspace.rest.get('nested');
                  const entities = await workspace.rest.list();
                  const child = await workspace.rest.execute('nested', { withResponse: true });
                  const listed = await workspace.email.list();
                  const next = await workspace.email.awaitEmail(
                    (candidate) => candidate.subject === 'match',
                    { timeoutMs: 100 },
                  );
                  const file = await files.open('fixture.txt');
                  const allowed = await runtime.requestPermission(
                    'network',
                    'https://example.test',
                    'conformance',
                  );
                  env.setSecret('runtime', runtime.kind);
                  return new Response(JSON.stringify({
                    label: decorate(entity.name),
                    entityCount: entities.length,
                    child: child.executionId,
                    listed: listed.length,
                    next: next.id,
                    file: await file.text(),
                    allowed,
                  }), { headers: { 'content-type': 'application/json' } });
                }
              `,
            ),
          );

          matches(
            result.mockResponse?.body,
            {
              kind: "json",
              value: {
                label: "shared:Nested",
                entityCount: 1,
                child: "child",
                listed: 1,
                next: "email-2",
                file: "fixture",
                allowed: true,
              },
            },
            "host-backed module result",
          );
          equal(
            result.environment.secrets.runtime,
            factory.kind,
            "runtime descriptor kind",
          );
          deepEqual(
            methods,
            [
              "entity.get",
              "entity.list",
              "entity.execute",
              "email.list",
              "email.next",
              "email.next",
              "file.resolve",
              "file.open",
              "permission.request",
            ],
            "host call order",
          );
        },
        hostCall,
        workspaceModule,
      );
    },
  },
  {
    name:
      "email waiting uses one absolute deadline across nonmatching candidates",
    async run(factory) {
      const remainingTimeouts: number[] = [];
      const hostCall: RuntimeHostCallHandler = async (method, input) => {
        if (method !== "email.next") {
          throw new Error(`Unexpected host call: ${method}`);
        }
        const timeoutMs = (input as { timeoutMs?: number }).timeoutMs;
        if (timeoutMs !== undefined) remainingTimeouts.push(timeoutMs);
        await new Promise((resolve) => setTimeout(resolve, 18));
        return {
          email: email(`candidate-${remainingTimeouts.length}`, "not a match"),
          cursor: `cursor-${remainingTimeouts.length}`,
        } as never;
      };

      await withSession(
        factory,
        async (session) => {
          await rejectsWith(
            session.invokeHook(
              await invocation(
                "onRequest",
                `
                  import { workspace } from 'yasumu:workspace';
                  export async function onRequest() {
                    await workspace.email.awaitEmail(
                      (candidate) => candidate.subject === 'match',
                      { timeoutMs: 45 },
                    );
                  }
                `,
              ),
            ),
            { code: "SCRIPT_EMAIL_TIMEOUT" },
          );
        },
        hostCall,
      );

      assert(
        remainingTimeouts.length >= 2,
        "email wait should inspect multiple candidates",
      );
      for (let index = 1; index < remainingTimeouts.length; index += 1) {
        assert(
          remainingTimeouts[index] < remainingTimeouts[index - 1],
          "email wait should pass the remaining absolute timeout",
        );
      }
    },
  },
  {
    name: "async tests, nested suite names, and deterministic outcomes",
    async run(factory) {
      await withSession(factory, async (session) => {
        const result = await session.invokeHook(
          await invocation(
            "onTest",
            `
              import { describe, expect, test } from 'yasumu:test';

              export async function onTest(ctx: { isTest: true }) {
                if (!ctx.isTest) throw new Error('missing test context');
                await Promise.resolve();
                await describe('outer', async () => {
                  await Promise.resolve();
                  test('passes', () => expect({ value: 1 }).toEqual({ value: 1 }));
                  await describe('inner', async () => {
                    test('skips', (control) => control.skip());
                  });
                });
                test('explicit success', (control) => control.succeed());
              }
            `,
            { mode: "test" },
          ),
        );

        matches(
          result.tests.map(({ suite, test, result: status }) => ({
            suite,
            test,
            status,
          })),
          [
            { suite: ["outer"], test: "passes", status: "pass" },
            { suite: ["outer", "inner"], test: "skips", status: "skip" },
            { suite: undefined, test: "explicit success", status: "pass" },
          ],
          "test results",
        );
      });
    },
  },
  {
    name: "legacy request mutation and YasumuResponse mocks",
    async run(factory) {
      await withSession(factory, async (session) => {
        const result = await session.invokeHook(
          await invocation(
            "onRequest",
            `
              export function onRequest(req) {
                req.url = 'https://example.test/legacy';
                req.method = 'PUT';
                req.headers.set('x-legacy', 'yes');
                req.env.setVariable('legacy', true);
                return new YasumuResponse({ received: req.json().value }, { status: 202 });
              }
            `,
          ),
        );

        equal(
          result.request?.url,
          "https://example.test/legacy",
          "legacy URL mutation",
        );
        equal(result.request?.method, "PUT", "legacy method mutation");
        assert(
          result.request?.headers.some(([name, value]) =>
            name === "x-legacy" && value === "yes"
          ) === true,
          "legacy header mutation",
        );
        matches(
          result.mockResponse?.body,
          { kind: "json", value: { received: 3 } },
          "legacy response body",
        );
        equal(result.mockResponse?.status, 202, "legacy response status");
        equal(
          result.environment.variables.legacy,
          true,
          "legacy environment mutation",
        );
      });
    },
  },
  {
    name: "hook selection, ordering, and response and email contexts",
    async run(factory) {
      await withSession(factory, async (session) => {
        const sourceId = "ordered-hooks";
        const code = `
          import { env } from 'yasumu:env';
          const order: string[] = [];
          function record(ctx, hook) {
            if (ctx.id !== ctx.entity.id) throw new Error(hook + ' context id mismatch');
            order.push(hook);
            env.setVariable('order', [...order]);
          }
          export function onRequest(ctx) {
            record(ctx, 'onRequest');
            return new Response('request-only');
          }
          export async function onResponse(ctx) {
            record(ctx, 'onResponse');
            env.setVariable('responseBody', (await ctx.res.json()).ok);
            env.setVariable('isMock', ctx.isMockResponse);
            return new Response('ignored');
          }
          export function onEmail(ctx) {
            record(ctx, 'onEmail');
            env.setVariable('subject', ctx.email.subject);
          }
        `;

        const requestResult = await session.invokeHook(
          await invocation("onRequest", code, { sourceId }),
        );
        const responseResult = await session.invokeHook(
          await invocation("onResponse", code, { sourceId }),
        );
        const emailInvocation = await invocation("onEmail", code, { sourceId });
        emailInvocation.email = email("email-hook", "email hook subject");
        const emailResult = await session.invokeHook(emailInvocation);

        deepEqual(
          requestResult.environment.variables.order,
          ["onRequest"],
          "request hook order",
        );
        deepEqual(
          responseResult.environment.variables.order,
          ["onRequest", "onResponse"],
          "response hook order",
        );
        equal(
          responseResult.environment.variables.responseBody,
          true,
          "response context body",
        );
        equal(
          responseResult.environment.variables.isMock,
          false,
          "mock response flag",
        );
        equal(
          responseResult.mockResponse,
          undefined,
          "response return is not a mock",
        );
        deepEqual(
          emailResult.environment.variables.order,
          ["onRequest", "onResponse", "onEmail"],
          "email hook order",
        );
        equal(
          emailResult.environment.variables.subject,
          "email hook subject",
          "email context",
        );
      });
    },
  },
  {
    name: "every missing lifecycle hook is a deterministic no-op",
    async run(factory) {
      await withSession(factory, async (session) => {
        const source = "export const onlySharedState = true;";
        const requestResult = await session.invokeHook(
          await invocation("onRequest", source),
        );
        const responseResult = await session.invokeHook(
          await invocation("onResponse", source),
        );
        const testResult = await session.invokeHook(
          await invocation("onTest", source, { mode: "test" }),
        );
        const emailInvocation = await invocation("onEmail", source);
        emailInvocation.email = email("missing-hook", "unused");
        const emailResult = await session.invokeHook(emailInvocation);

        for (
          const result of [
            requestResult,
            responseResult,
            testResult,
            emailResult,
          ]
        ) {
          deepEqual(result.tests, [], "missing hook tests");
          deepEqual(result.logs, [], "missing hook logs");
          deepEqual(result.diagnostics, [], "missing hook diagnostics");
          deepEqual(result.environment.variables, {}, "missing hook variables");
          deepEqual(result.environment.secrets, {}, "missing hook secrets");
        }
        equal(
          requestResult.mockResponse,
          undefined,
          "missing request hook mock",
        );
      });
    },
  },
  {
    name: "script cancellation and structured hook and compile errors",
    async run(factory) {
      await withSession(factory, async (session) => {
        const cancelled = await session.invokeHook(
          await invocation(
            "onRequest",
            "export function onRequest(ctx) { ctx.cancel('stop here'); }",
          ),
        );
        equal(cancelled.cancelled, true, "script cancellation flag");
        equal(
          cancelled.cancelReason,
          "stop here",
          "script cancellation reason",
        );

        await rejectsWith(
          session.invokeHook(
            await invocation(
              "onRequest",
              "export function onRequest() { throw new TypeError('broken hook'); }",
            ),
          ),
          {
            code: "SCRIPT_HOOK_ERROR",
            message: "broken hook",
            name: "TypeError",
          },
        );
        await rejectsWith(
          session.invokeHook(
            await invocation("onRequest", "export function onRequest( {"),
          ),
          { code: "SCRIPT_COMPILE_ERROR" },
        );
      });
    },
  },
  {
    name: "external cancellation, hard timeouts, worker recovery, and disposal",
    async run(factory) {
      const runtime = factory.create({ defaultTimeoutMs: 80 });
      const session = await runtime.createSession({
        workspace,
        hostCall: rejectingHostCall,
      });
      const controller = new AbortController();
      try {
        const externallyCancelled = session.invokeHook(
          await invocation(
            "onRequest",
            "export async function onRequest() { await new Promise(() => undefined); }",
          ),
          { signal: controller.signal },
        );
        setTimeout(() => controller.abort("terminal signal"), 20);
        await rejectsWith(externallyCancelled, {
          code: "SCRIPT_CANCELLED",
          message: "terminal signal",
        });

        await rejectsWith(
          session.invokeHook(
            await invocation(
              "onRequest",
              "export function onRequest() { while (true) {} }",
            ),
          ),
          { code: "SCRIPT_TIMEOUT" },
        );

        const recovered = await session.invokeHook(
          await invocation(
            "onRequest",
            `
              export function onRequest() {
                return new Response('recovered', { headers: { 'content-type': 'text/plain' } });
              }
            `,
          ),
        );
        matches(
          recovered.mockResponse?.body,
          { kind: "text", text: "recovered" },
          "worker recovery",
        );

        await session.dispose();
        await rejectsWith(
          session.invokeHook(
            await invocation("onRequest", "export function onRequest() {}"),
          ),
          { code: "SCRIPT_SESSION_DISPOSED" },
        );
      } finally {
        await session.dispose();
      }
    },
  },
];

export async function runRuntimeConformance(
  factory: RuntimeConformanceFactory,
): Promise<string[]> {
  const completed: string[] = [];
  for (const testCase of runtimeConformanceCases) {
    await testCase.run(factory);
    completed.push(testCase.name);
  }
  return completed;
}

async function withSession(
  factory: RuntimeConformanceFactory,
  run: (session: YasumuRuntimeSession) => Promise<void>,
  hostCall: RuntimeHostCallHandler = rejectingHostCall,
  workspaceModule?: ScriptSource,
): Promise<void> {
  const session = await factory.create().createSession({
    workspace,
    workspaceModule,
    hostCall,
  });
  try {
    await run(session);
  } finally {
    await session.dispose();
  }
}

async function invocation(
  hook: ScriptHookInvocation["hook"],
  code: string,
  options: { mode?: "run" | "test"; sourceId?: string } = {},
): Promise<ScriptHookInvocation> {
  executionSequence += 1;
  const request = await snapshotRequest(
    new Request("https://example.test/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: 3 }),
    }),
  );
  const response = await snapshotResponse(
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  const executionId = `execution-${executionSequence}`;

  return {
    hook,
    source: { id: options.sourceId ?? `script-${executionSequence}`, code },
    workspace,
    entity: { id: "entity-1", name: "Entity", kind: "rest" },
    execution: {
      id: executionId,
      rootId: executionId,
      depth: 0,
      mode: options.mode ?? "run",
      startedAt: Date.now(),
    },
    environment: { variables: {}, secrets: {} },
    request,
    response,
    isMockResponse: false,
  };
}

const rejectingHostCall: RuntimeHostCallHandler = async (method) => {
  throw new Error(`Unexpected host call: ${method}`);
};

function email(id: string, subject: string): WorkspaceEmail {
  return {
    id,
    from: "sender@example.test",
    to: ["receiver@example.test"],
    cc: [],
    subject,
    html: "",
    text: subject,
    createdAt: Date.now(),
  };
}

function assert(condition: boolean, label: string): asserts condition {
  if (!condition) throw new Error(`Conformance assertion failed: ${label}`);
}

function equal(actual: unknown, expected: unknown, label: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `Conformance assertion failed: ${label}\nExpected: ${
        format(expected)
      }\nActual: ${format(actual)}`,
    );
  }
}

function deepEqual(actual: unknown, expected: unknown, label: string): void {
  const actualValue = JSON.stringify(actual);
  const expectedValue = JSON.stringify(expected);
  if (actualValue !== expectedValue) {
    throw new Error(
      `Conformance assertion failed: ${label}\nExpected: ${expectedValue}\nActual: ${actualValue}`,
    );
  }
}

function matches(actual: unknown, expected: unknown, label: string): void {
  if (Array.isArray(expected)) {
    assert(Array.isArray(actual), label);
    equal(actual.length, expected.length, `${label} length`);
    expected.forEach((value, index) =>
      matches(actual[index], value, `${label}[${index}]`)
    );
    return;
  }
  if (expected !== null && typeof expected === "object") {
    assert(actual !== null && typeof actual === "object", label);
    for (const [key, value] of Object.entries(expected)) {
      matches(
        (actual as Record<string, unknown>)[key],
        value,
        `${label}.${key}`,
      );
    }
    return;
  }
  equal(actual, expected, label);
}

async function rejectsWith(
  promise: Promise<unknown>,
  expected: Readonly<Record<string, unknown>>,
): Promise<void> {
  try {
    await promise;
  } catch (error) {
    for (const [key, value] of Object.entries(expected)) {
      equal(
        (error as Record<string, unknown>)[key],
        value,
        `rejected error ${key}`,
      );
    }
    return;
  }
  throw new Error(
    `Conformance assertion failed: expected rejection ${format(expected)}`,
  );
}

function format(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}
