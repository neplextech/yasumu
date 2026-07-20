// This file is generated from packages/runtime-api/contract/runtime-api.json. Do not edit.

export const RUNTIME_API_VERSION = 1 as const;
export const SCRIPT_HOOK_NAMES = ['onRequest', 'onResponse', 'onTest', 'onEmail'] as const;
export type ScriptHookName = (typeof SCRIPT_HOOK_NAMES)[number];
export const VIRTUAL_MODULES = {
  'yasumu:test': ['describe', 'test', 'expect'],
  'yasumu:workspace': ['workspace'],
  'yasumu:runtime': ['runtime'],
  'yasumu:env': ['env'],
  'yasumu:files': ['files'],
} as const;
export type VirtualModuleName = keyof typeof VIRTUAL_MODULES;
export const RUNTIME_CAPABILITY_NAMES = [
  'workers',
  'nodeBuiltins',
  'filesystemRead',
  'filesystemWrite',
  'network',
  'environment',
  'subprocess',
  'ffi',
  'nativeModules',
  'virtualModules',
  'workspaceFiles',
  'email',
  'nestedExecution',
] as const;
export const RUNTIME_WORKER_MESSAGE_TYPES = [
  'ready',
  'invoke',
  'result',
  'error',
  'log',
  'host-call',
  'host-result',
  'cancel',
  'dispose',
] as const;
export const RUNTIME_HOST_METHODS = [
  'entity.get',
  'entity.list',
  'entity.execute',
  'email.list',
  'email.next',
  'file.resolve',
  'file.open',
  'permission.request',
] as const;
