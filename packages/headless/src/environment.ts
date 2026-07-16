import type { EnvironmentSnapshot, JsonValue } from '@yasumu/runtime-api';

import { YasumuError, YasumuErrorCodes } from './errors.js';
import { SecretRedactor } from './interpolation.js';
import type { WorkspaceEnvironment } from './model.js';

export interface EnvironmentResolutionInput {
  environment?: WorkspaceEnvironment;
  workspaceDefaults?: Record<string, JsonValue>;
  dotenv?: Record<string, string>;
  process?: Record<string, string | undefined>;
  cliVariables?: Record<string, JsonValue>;
  cliSecrets?: Record<string, string>;
  executionVariables?: Record<string, JsonValue>;
  executionSecrets?: Record<string, string>;
  providedSecrets?: Record<string, string>;
  requireSecrets?: boolean;
}

export interface ResolvedEnvironment {
  snapshot: EnvironmentSnapshot;
  redactor: SecretRedactor;
}

export function resolveEnvironment(input: EnvironmentResolutionInput): ResolvedEnvironment {
  const variables: Record<string, JsonValue> = { ...(input.workspaceDefaults ?? {}) };
  const secrets: Record<string, string> = {};
  const definitions = new Set<string>();

  for (const variable of input.environment?.variables ?? []) {
    if (variable.enabled) variables[variable.key] = variable.value;
  }
  for (const secret of input.environment?.secrets ?? []) {
    if (!secret.enabled) continue;
    definitions.add(secret.key);
    if (secret.value) secrets[secret.key] = secret.value;
  }

  applyNamedStrings(variables, input.dotenv);
  applyNamedSecrets(secrets, definitions, input.dotenv);
  applyProcess(variables, secrets, definitions, input.process);
  Object.assign(secrets, input.providedSecrets ?? {});
  Object.assign(variables, input.cliVariables ?? {});
  Object.assign(secrets, input.cliSecrets ?? {});
  Object.assign(variables, input.executionVariables ?? {});
  Object.assign(secrets, input.executionSecrets ?? {});

  if (input.requireSecrets) {
    const missing = [...definitions].filter((key) => !(key in secrets));
    if (missing.length > 0) {
      throw new YasumuError(
        YasumuErrorCodes.MissingSecret,
        `Missing required secret${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      );
    }
  }

  return {
    snapshot: {
      id: input.environment?.id,
      name: input.environment?.name,
      variables,
      secrets,
    },
    redactor: new SecretRedactor(Object.values(secrets)),
  };
}

function applyNamedStrings(target: Record<string, JsonValue>, values?: Record<string, string>): void {
  if (!values) return;
  for (const key of Object.keys(target)) {
    if (values[key] !== undefined) target[key] = values[key];
    if (values[`YASUMU_VAR_${key}`] !== undefined) target[key] = values[`YASUMU_VAR_${key}`]!;
  }
}

function applyNamedSecrets(
  target: Record<string, string>,
  definitions: Set<string>,
  values?: Record<string, string>,
): void {
  if (!values) return;
  for (const key of definitions) {
    const value = values[`YASUMU_ENV_${key}`] ?? values[key];
    if (value !== undefined) target[key] = value;
  }
}

function applyProcess(
  variables: Record<string, JsonValue>,
  secrets: Record<string, string>,
  definitions: Set<string>,
  processValues?: Record<string, string | undefined>,
): void {
  if (!processValues) return;
  for (const key of Object.keys(variables)) {
    const value = processValues[`YASUMU_VAR_${key}`] ?? processValues[key];
    if (value !== undefined) variables[key] = value;
  }
  for (const key of definitions) {
    const value = processValues[`YASUMU_ENV_${key}`] ?? processValues[key];
    if (value !== undefined) secrets[key] = value;
  }
}

export function parseDotenv(content: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line
      .slice(0, separator)
      .trim()
      .replace(/^export\s+/, '');
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '');
    }
    values[key] = value.replace(/\\n/g, '\n');
  }
  return values;
}
