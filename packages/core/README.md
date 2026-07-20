# `@yasumu/core`

Typed client APIs for Yasumu's workspace-scoped RPC surface. Alongside REST,
GraphQL, SSE, execution, environments, and email, each `Workspace` exposes a
`cookies` module for listing, editing, resolving, ingesting, and clearing the
local cookie jar. Cookie state is desktop-local and never part of workspace
YSL serialization.
