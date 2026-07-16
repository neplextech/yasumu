// This file is generated from packages/runtime-api/contract/runtime-api.json. Do not edit.

export const YASUMU_RUNTIME_API_VERSION = 1 as const;
export const YASUMU_SCRIPT_HOOKS = ["onRequest", "onResponse", "onTest", "onEmail"] as const;
export const YASUMU_VIRTUAL_MODULES = ["yasumu:test", "yasumu:workspace", "yasumu:runtime", "yasumu:env", "yasumu:files"] as const;
export const YASUMU_RUNTIME_HOST_METHODS = ["entity.get", "entity.list", "entity.execute", "email.list", "email.next", "file.resolve", "file.open", "permission.request"] as const;
