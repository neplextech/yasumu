import {
  t,
  serialize,
  deserialize,
  type YasumuSchemaParsableToType,
} from '../src/index.js';

const script = `
@Example

Metadata {
    name: "Test"
    method: GET
}

Request {
    url: "https://example.com"
    body: null
    params: {
        key1: "hello"
        key2: 123
        key3: true
        key4: null
    }
}

Test {
    console.log("tested");
}
`;

export const YasumuExampleScript = t.script({
  annotation: 'Example',
  blocks: {
    Metadata: t.object({
      name: t.nullable(t.string()),
      method: t.nullable(t.enum('GET', 'POST')),
    }),
    Request: t.object({
      url: t.string(),
      params: t.nullable(
        t.record(t.union(t.string(), t.number(), t.boolean(), t.null())),
      ),
      headers: t.nullable(t.record(t.string())),
      body: t.nullable(
        t.object({
          type: t.string(),
          data: t.string(),
        }),
      ),
    }),
    BeforeRequest: t.nullable(t.code()),
    AfterRequest: t.nullable(t.code()),
    Test: t.nullable(t.code()),
  },
});

const scriptValue: YasumuSchemaParsableToType<typeof YasumuExampleScript> = {
  annotation: 'Example',
  blocks: {
    Metadata: {
      name: 'Test',
      method: 'GET',
    },
    Request: {
      url: 'https://example.com',
      body: null,
      params: {
        key1: 'hello',
        key2: 123,
        key3: true,
        key4: null,
      },
      headers: null,
    },
    Test: '\n    console.log("tested");\n',
    BeforeRequest: null,
    AfterRequest: null,
  },
};

const start = () => {
  const parsed = deserialize(script, YasumuExampleScript);
  console.log(JSON.stringify(parsed, null, 4));
  console.log('');
  console.log(serialize(parsed, YasumuExampleScript));
};

start();
