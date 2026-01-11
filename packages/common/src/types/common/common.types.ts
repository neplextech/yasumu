import type { EnvironmentData } from '../environment/environment.types.js';
import type { YasumuScriptingLanguage } from './constants.js';

export interface YasumuEmbeddedScript {
  /**
   * The language of the script.
   */
  language: YasumuScriptingLanguage;
  /**
   * The code of the script.
   */
  code: string;
}

export interface ScriptWorkspaceContext {
  /**
   * The id of the workspace.
   */
  id: string;
  /**
   * The name of the workspace.
   */
  name: string;
  /**
   * The path of the workspace.
   */
  path: string | null;
}

export interface CommonScriptRuntimeContext {
  /**
   * The current environment of the script runtime.
   */
  environment: EnvironmentData | null;
  /**
   * The current workspace context data.
   */
  workspace: ScriptWorkspaceContext;
}

export interface ExecutableScript<Context = any> {
  /**
   * The id of the entity that this script belongs to.
   */
  entityId: string;
  /**
   * The target function to be executed.
   */
  invocationTarget: string;
  /**
   * The script to be executed.
   */
  script: YasumuEmbeddedScript;
  /**
   * The context data of the script.
   */
  context: Context;
}

/**
 * The result of the script execution that was successful.
 */
export interface SuccessExecutionResult {
  /**
   * Whether the script execution was successful.
   */
  success: true;
  /**
   * The result of the script execution.
   */
  result: any;
}

/**
 * The result of the script execution that was failed.
 */
export interface FailedExecutionResult {
  /**
   * Whether the script execution was failed.
   */
  success: false;
  /**
   * The error message of the script execution.
   */
  error: string;
}

/**
 * The result of the script execution.
 */
export type ScriptExecutionResultOrError =
  | SuccessExecutionResult
  | FailedExecutionResult;

/**
 * Checks if the result is a successful script execution result.
 */
export function isSuccessExecutionResult(
  result: unknown,
): result is SuccessExecutionResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    result.success === true
  );
}

/**
 * Checks if the result is a failed script execution result.
 */
export function isFailedExecutionResult(
  result: unknown,
): result is FailedExecutionResult {
  return !isSuccessExecutionResult(result);
}

/**
 * The result of the script execution.
 */
export interface ScriptExecutionResult<Context = any> {
  /**
   * The context data of the script execution.
   */
  context: Context;
  /**
   * The execution result of the script.
   */
  result: ScriptExecutionResultOrError;
  /**
   * The test execution result, if tests were run.
   */
  testResult?: ScriptExecutionResultOrError;
}

/**
 * Represents a key-value pair with an optional enabled flag, commonly represented in tabular form.
 */
export interface TabularPair {
  /**
   * The key of the pair.
   */
  key: string;
  /**
   * The value of the pair.
   */
  value: string;
  /**
   * Whether the pair is enabled.
   */
  enabled: boolean;
}

/**
 * The custom metadata that can be associated with an entity.
 */
export interface CustomMetadata<T = any> {
  /**
   * The arbitrary data that can be associated with an entity.
   * This can be used to store arbitrary data that is not part of the schema.
   */
  metadata: T;
}

/**
 * The common entity type
 */
export interface CommonEntity extends CustomMetadata {
  /**
   * The id of the entity.
   */
  id: string;
  /**
   * The created at timestamp.
   */
  createdAt: number;
  /**
   * The updated at timestamp.
   */
  updatedAt: number;
}

/**
 * The type of the entity.
 */
export type EntityType = 'rest' | 'graphql' | 'websocket' | 'socketio' | 'sse';

/**
 * The paginated list of items.
 */
export interface PaginatedResult<T> {
  /**
   * The total number of items.
   */
  totalItems: number;
  /**
   * The items in the list.
   */
  items: T[];
}
