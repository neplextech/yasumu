# Yasumu Schema Language

`@yasumu/schema` provides the parser, serializer, schema-building primitives, and canonical schemas for Yasumu
workspace files.

## Parse a Yasumu document

```ts
import { RestSchema, deserialize } from '@yasumu/schema';

const source = `
@rest

metadata {
  name: "Get user"
  method: "GET"
  id: "get-user"
  groupId: null
}

request {
  url: "https://api.example.com/users/1"
  headers: []
  parameters: []
  searchParameters: []
  body: null
}

dependencies []
`;

const document = deserialize(source, RestSchema);
console.log(document.blocks.metadata.name);
```

The canonical `YasumuAnnotations`, `WorkspaceSchema`, `RestSchema`, `GraphqlSchema`, `EnvironmentSchema`, and
`SmtpSchema` exports are available from both `@yasumu/schema` and `@yasumu/schema/yasumu`.

## Define a custom schema

```ts
import { deserialize, t } from '@yasumu/schema';

const ExampleSchema = t.script({
  annotation: 'example',
  blocks: {
    metadata: t.object({
      name: t.string(),
      retries: t.optional(t.number()),
    }),
  },
});

const document = deserialize('@example\nmetadata { name: "Demo" }', ExampleSchema);
console.log(document.blocks.metadata);
```

Parse failures throw `YasumuSchemaParserError`. Its `span` property contains the structured start and end line and
column positions for diagnostics.
