import { describe, expect, it } from 'vitest';

import {
  EnvironmentSchema,
  GraphqlSchema,
  RestSchema,
  SseSchema,
  SmtpSchema,
  WorkspaceSchema,
  YasumuAnnotations,
  YasumuSchemaParserError,
  deserialize,
  serialize,
  t,
} from '../src/index.js';

function getParserError(parse: () => unknown): YasumuSchemaParserError {
  try {
    parse();
  } catch (error) {
    expect(error).toBeInstanceOf(YasumuSchemaParserError);
    return error as YasumuSchemaParserError;
  }
  throw new Error('Expected parsing to fail');
}

describe('canonical Yasumu schemas', () => {
  it('exports every supported annotation and document schema', () => {
    expect(YasumuAnnotations).toEqual({
      Workspace: 'workspace',
      Rest: 'rest',
      Graphql: 'graphql',
      Sse: 'sse',
      Smtp: 'smtp',
      Environment: 'environment',
    });
    expect([WorkspaceSchema, RestSchema, GraphqlSchema, SseSchema, EnvironmentSchema, SmtpSchema]).not.toContain(
      undefined,
    );
  });

  it('loads workspaces created before workspace and group scripts were added', () => {
    const document = deserialize(
      `@workspace

metadata {
  id: "workspace-id"
  name: "Example"
  version: 0
}

snapshot 1

groups {
  groupId: {
    id: "group-id"
    name: "Requests"
    entity: graphql
    parentId: null
    workspaceId: "workspace-id"
  }
}
`,
      WorkspaceSchema,
    );

    expect(document.blocks.script).toBeUndefined();
    expect(document.blocks.groups.groupId?.script).toBeUndefined();
    expect(document.blocks.groups.groupId?.entity).toBe('graphql');

    const serialized = serialize(document, WorkspaceSchema);
    expect(serialized).not.toContain('\nscript ');
    expect(deserialize(serialized, WorkspaceSchema)).toEqual(document);
  });

  it('parses workspace and group scripts when present', () => {
    const document = deserialize(
      `@workspace

metadata { id: "workspace-id" name: "Example" version: 0 }
snapshot 1
groups {
  groupId: {
    id: "group-id"
    name: "Requests"
    entity: rest
    parentId: null
    workspaceId: "workspace-id"
    script: { export const groupValue = { nested: true }; }
  }
}
script { export const workspaceValue = "}"; }
`,
      WorkspaceSchema,
    );

    expect(document.blocks.script).toContain('workspaceValue');
    expect(document.blocks.groups.groupId?.script).toContain('groupValue');
  });

  it('round-trips complete SSE request and reconnect documents', () => {
    const source = `@sse
metadata { id: "events" name: "Events" method: "POST" groupId: null }
request {
  url: "{{API_URL}}/events"
  headers: [{ key: "authorization" value: "Bearer {{TOKEN}}" enabled: true }]
  parameters: []
  searchParameters: [{ key: "topic" value: "{{TOPIC}}" enabled: true }]
  body: { type: "json" content: "{\\"active\\":{{ACTIVE}}}" }
}
events ["update", "{{EVENT_TYPE}}"]
reconnect { enabled: true retryMs: 250 }
dependencies ["parent-stream"]
script { export function onRequest(ctx) { console.log(ctx.id); } }
test { export function onTest() { test("stream", () => expect(true).toBe(true)); } }
`;
    const document = deserialize(source, SseSchema);

    expect(document.blocks.events).toEqual(['update', '{{EVENT_TYPE}}']);
    expect(document.blocks.reconnect).toEqual({ enabled: true, retryMs: 250 });
    expect(document.blocks.request.body?.content).toBe('{"active":{{ACTIVE}}}');
    const serialized = serialize(document, SseSchema);
    const reparsed = deserialize(serialized, SseSchema);
    expect(reparsed.blocks.request).toEqual(document.blocks.request);
    expect(reparsed.blocks.events).toEqual(document.blocks.events);
    expect(reparsed.blocks.reconnect).toEqual(document.blocks.reconnect);
    expect(reparsed.blocks.dependencies).toEqual(document.blocks.dependencies);
    expect(reparsed.blocks.script?.trim()).toBe(document.blocks.script?.trim());
    expect(reparsed.blocks.test?.trim()).toBe(document.blocks.test?.trim());
  });
});

describe('parser diagnostics', () => {
  it('rejects duplicate top-level blocks with the duplicate token span', () => {
    const schema = t.script({ annotation: 'example', blocks: { value: t.string() } });
    const error = getParserError(() => deserialize('@example\nvalue "first"\nvalue "second"', schema));

    expect(error.message).toContain("Duplicate block 'value'");
    expect(error.span).toEqual({
      start: { line: 3, column: 1 },
      end: { line: 3, column: 6 },
    });
  });

  it('rejects duplicate object and record keys', () => {
    const objectSchema = t.script({
      annotation: 'example',
      blocks: { metadata: t.object({ name: t.string() }) },
    });
    const objectError = getParserError(() =>
      deserialize('@example\nmetadata {\n  name: "first"\n  name: "second"\n}', objectSchema),
    );
    expect(objectError.message).toContain("Duplicate object key 'name'");
    expect(objectError.span?.start).toEqual({ line: 4, column: 3 });

    const recordSchema = t.script({ annotation: 'example', blocks: { values: t.record(t.string()) } });
    const recordError = getParserError(() =>
      deserialize('@example\nvalues {\n  name: "first"\n  name: "second"\n}', recordSchema),
    );
    expect(recordError.message).toContain("Duplicate object key 'name'");
    expect(recordError.span?.start).toEqual({ line: 4, column: 3 });
  });

  it('reports the invalid enum token instead of the following token', () => {
    const schema = t.script({ annotation: 'example', blocks: { kind: t.enum('valid'), next: t.string() } });
    const error = getParserError(() => deserialize('@example\nkind invalid\nnext "value"', schema));

    expect(error.message).toContain('Invalid enum value "invalid"');
    expect(error.span).toEqual({
      start: { line: 2, column: 6 },
      end: { line: 2, column: 13 },
    });
  });

  it('fails predictably for an unterminated raw identifier', () => {
    const schema = t.script({ annotation: 'example', blocks: { values: t.record(t.string()) } });
    const error = getParserError(() => deserialize('@example\nvalues { `unterminated', schema));

    expect(error.message).toContain('Missing end delimiter (`)');
    expect(error.span?.start).toEqual({ line: 2, column: 10 });
  });
});

describe('number and code parsing', () => {
  it('parses signed, decimal, leading-decimal, and exponent numbers', () => {
    const schema = t.script({
      annotation: 'numbers',
      blocks: {
        values: t.object({
          negative: t.number(),
          positive: t.number(),
          leading: t.number(),
          exponent: t.number(),
        }),
      },
    });

    const document = deserialize(
      '@numbers\nvalues { negative: -12.5 positive: +3.25 leading: -.5 exponent: 1.5e2 }',
      schema,
    );

    expect(document.blocks.values).toEqual({
      negative: -12.5,
      positive: 3.25,
      leading: -0.5,
      exponent: 150,
    });
  });

  it('does not terminate code blocks on braces inside JavaScript syntax', () => {
    const schema = t.script({
      annotation: 'script',
      blocks: {
        code: t.code(),
        name: t.string(),
      },
    });
    const document = deserialize(
      `@script
code {
  const closing = "}";
  const opening = '{';
  const object = { nested: { value: true } };
  const template = \`literal } \${JSON.stringify({ ok: true })}\`;
  const regex = /[{}]/;
  // A comment containing }
  /* A comment containing { and } */
  export function onRequest() {
    return { closing, opening, object, template, regex };
  }
}
name "after-code"
`,
      schema,
    );

    expect(document.blocks.code).toContain('return { closing, opening, object, template, regex };');
    expect(document.blocks.name).toBe('after-code');
  });
});
