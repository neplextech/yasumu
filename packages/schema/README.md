# Yasumu Schema Language

Yasumu Schema Language Parser

## Example

```ts
import { YasumuSchemaScriptActions } from "@yasumu/schema";

const code = `
Metadata {
    name: "Get request"
    method: "GET"
}

Request {
    url: "https://example.com"
    body: null
}

Test {
    console.log("tested");
}
`;

const parsed = YasumuSchemaScriptActions.parse(script);
console.log(parsed);
```
