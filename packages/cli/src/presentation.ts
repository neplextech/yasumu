import {
  serializeYasumuError,
  type ExecutableEntity,
  type ExecutionResult,
  type WorkspaceLoadResult,
  type YasumuWorkspace,
} from '@yasumu/headless';
import type { Diagnostic, SerializedBody, TestResult } from '@yasumu/runtime-api';
import pc from 'picocolors';

import { executionFailed, sortedEntities } from './application.js';

export function printValidation(root: string, result: WorkspaceLoadResult, json: boolean): void {
  const diagnostics = sortDiagnostics(result.diagnostics);
  const payload = {
    ok: result.workspace !== undefined,
    root,
    workspace: result.workspace ? workspaceSummary(result.workspace) : undefined,
    diagnostics,
  };
  if (json) return printJson(payload);

  if (result.workspace) {
    console.log(
      `${pc.green('VALID')} ${pc.bold(result.workspace.name)} ` +
        pc.dim(`(${result.workspace.entities.length} entities, ${result.workspace.environments.length} environments)`),
    );
  } else {
    console.error(`${pc.red('INVALID')} ${root}`);
  }
  printDiagnostics(diagnostics);
}

export function printList(workspace: YasumuWorkspace, entities: ExecutableEntity[], json: boolean): void {
  const payload = {
    ok: true,
    workspace: workspaceSummary(workspace),
    entities: entities.map(entitySummary),
    environments: workspace.environments
      .map((environment) => ({
        id: environment.id,
        name: environment.name,
        variables: environment.variables.filter((entry) => entry.enabled).length,
        secrets: environment.secrets.filter((entry) => entry.enabled).length,
      }))
      .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id)),
    groups: workspace.groups
      .map((group) => ({
        id: group.id,
        name: group.name,
        kind: group.entityKind,
        parentId: group.parentId,
        hasScript: group.script !== undefined,
      }))
      .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id)),
  };
  if (json) return printJson(payload);

  console.log(`${pc.bold(workspace.name)} ${pc.dim(`(${workspace.id})`)}`);
  if (entities.length === 0) {
    console.log(pc.yellow('No executable entities found.'));
    return;
  }
  for (const entity of entities) {
    const method = entity.kind === 'graphql' ? 'POST' : entity.method;
    const flags = [entity.scripts.lifecycle ? 'script' : undefined, entity.scripts.test ? 'test' : undefined]
      .filter((value): value is string => value !== undefined)
      .join(', ');
    console.log(
      `${kindColor(entity.kind)(entity.kind.toUpperCase().padEnd(7))} ${pc.bold(entity.name)} ${pc.dim(entity.id)}` +
        (flags ? pc.dim(` [${flags}]`) : ''),
    );
    console.log(pc.dim(`         ${method} ${entity.url ?? '(no URL)'}`));
  }
}

export function printInfo(workspace: YasumuWorkspace, json: boolean): void {
  const entities = sortedEntities(workspace);
  const payload = {
    ok: true,
    workspace: workspaceSummary(workspace),
    stats: {
      restEntities: entities.filter((entity) => entity.kind === 'rest').length,
      graphqlEntities: entities.filter((entity) => entity.kind === 'graphql').length,
      sseEntities: entities.filter((entity) => entity.kind === 'sse').length,
      environments: workspace.environments.length,
      groups: workspace.groups.length,
    },
    entities: entities.map(entitySummary),
  };
  if (json) return printJson(payload);

  console.log(pc.bold(pc.cyan('Yasumu Workspace')));
  console.log(`Name:         ${workspace.name}`);
  console.log(`ID:           ${pc.dim(workspace.id)}`);
  console.log(`Version:      ${workspace.version}`);
  console.log(`Root:         ${pc.dim(workspace.root ?? '(not set)')}`);
  console.log(`REST:         ${payload.stats.restEntities}`);
  console.log(`GraphQL:      ${payload.stats.graphqlEntities}`);
  console.log(`SSE:          ${payload.stats.sseEntities}`);
  console.log(`Environments: ${payload.stats.environments}`);
  console.log(`Groups:       ${payload.stats.groups}`);
}

export function printExecution(
  workspace: YasumuWorkspace,
  mode: 'run' | 'test',
  selected: ExecutableEntity[],
  results: ExecutionResult[],
  json: boolean,
  verbose: boolean,
): void {
  const failed = results.filter((result) => result.status !== 'cancelled' && executionFailed(result, mode)).length;
  const cancelled = results.filter((result) => result.status === 'cancelled').length;
  const tests = results.flatMap((result) => result.tests);
  const payload = {
    ok: failed === 0 && cancelled === 0 && results.length === selected.length,
    mode,
    workspace: workspaceSummary(workspace),
    summary: {
      selected: selected.length,
      completed: results.filter((result) => result.status === 'completed').length,
      failed,
      cancelled,
      tests: testSummary(tests),
    },
    results,
  };
  if (json) return printJson(payload);

  for (const result of results) {
    const entity = selected.find((candidate) => candidate.id === result.entityId);
    const passed = !executionFailed(result, mode);
    const status = passed ? pc.green('PASS') : result.status === 'cancelled' ? pc.yellow('CANCELLED') : pc.red('FAIL');
    const response = result.response ? ` ${result.response.status} ${result.response.statusText}` : '';
    const mocked = result.isMockResponse ? pc.magenta(' [mocked]') : '';
    console.log(
      `${status} ${pc.bold(entity?.name ?? result.entityId)}${response}${mocked} ${pc.dim(`${result.durationMs}ms`)}`,
    );
    if (result.error) console.error(pc.red(`  ${result.error.code}: ${result.error.message}`));
    for (const event of result.events) {
      console.log(
        `${pc.blue('  EVENT')} ${pc.bold(event.event)}${event.id === undefined ? '' : pc.dim(` #${event.id}`)} ${event.data}`,
      );
    }
    for (const diagnostic of sortDiagnostics(result.diagnostics)) printDiagnostic(diagnostic, '  ');
    for (const log of result.logs) {
      const color = log.level === 'error' ? pc.red : log.level === 'warn' ? pc.yellow : pc.dim;
      console.log(color(`  ${log.level}: ${log.message}`));
    }
    for (const test of result.tests) printTest(test);
    if (verbose) {
      if (result.request) {
        console.log(pc.dim(`  Request: ${result.request.method} ${result.request.url}`));
        printBody('  Request body', result.request.body);
      }
      if (result.response) printBody('  Response body', result.response.body);
    }
  }
  if (results.length === 0 && selected.length > 0) console.log(pc.yellow('No executions completed.'));
  console.log(
    `${pc.bold('Summary:')} ${payload.summary.completed} completed, ${payload.summary.failed} failed, ` +
      `${payload.summary.cancelled} cancelled, ${payload.summary.tests.passed} tests passed, ` +
      `${payload.summary.tests.failed} tests failed`,
  );
}

export function printCommandError(error: unknown, json: boolean, code = 'CLI_ERROR'): void {
  const serialized = serializeYasumuError(error);
  const payload = {
    ok: false,
    error: {
      ...serialized,
      code: serialized.code === 'REQUEST_FAILED' ? code : serialized.code,
    },
  };
  if (json) printJson(payload);
  else console.error(pc.red(`${payload.error.code}: ${payload.error.message}`));
}

function workspaceSummary(workspace: YasumuWorkspace) {
  return {
    id: workspace.id,
    name: workspace.name,
    version: workspace.version,
    root: workspace.root,
  };
}

function entitySummary(entity: ExecutableEntity) {
  return {
    id: entity.id,
    name: entity.name,
    kind: entity.kind,
    method: entity.kind === 'graphql' ? 'POST' : entity.method,
    url: entity.url,
    groupId: entity.groupId,
    hasScript: entity.scripts.lifecycle !== undefined,
    hasTest: entity.scripts.test !== undefined,
  };
}

function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  return [...diagnostics].sort((left, right) => {
    const leftStart = left.range?.start;
    const rightStart = right.range?.start;
    return (
      (left.file ?? '').localeCompare(right.file ?? '') ||
      (leftStart?.line ?? 0) - (rightStart?.line ?? 0) ||
      (leftStart?.column ?? 0) - (rightStart?.column ?? 0) ||
      left.code.localeCompare(right.code) ||
      left.message.localeCompare(right.message)
    );
  });
}

function printDiagnostics(diagnostics: Diagnostic[]): void {
  for (const diagnostic of diagnostics) printDiagnostic(diagnostic);
}

function printDiagnostic(diagnostic: Diagnostic, prefix = ''): void {
  const location = diagnostic.file
    ? `${diagnostic.file}${diagnostic.range ? `:${diagnostic.range.start.line}:${diagnostic.range.start.column}` : ''}`
    : undefined;
  const label = `${diagnostic.severity.toUpperCase()} ${diagnostic.code}`;
  const color = diagnostic.severity === 'error' ? pc.red : diagnostic.severity === 'warning' ? pc.yellow : pc.cyan;
  console.error(`${prefix}${color(label)}${location ? ` ${pc.dim(location)}` : ''} ${diagnostic.message}`);
}

function printTest(test: TestResult): void {
  const label = test.result === 'pass' ? pc.green('PASS') : test.result === 'skip' ? pc.yellow('SKIP') : pc.red('FAIL');
  const suite = test.suite?.length ? `${test.suite.join(' > ')} > ` : '';
  console.log(`  ${label} ${suite}${test.test} ${pc.dim(`${test.duration.toFixed(1)}ms`)}`);
  if (test.error) console.error(pc.red(`    ${test.error}`));
}

function testSummary(tests: TestResult[]) {
  return {
    total: tests.length,
    passed: tests.filter((test) => test.result === 'pass').length,
    failed: tests.filter((test) => test.result === 'fail').length,
    skipped: tests.filter((test) => test.result === 'skip').length,
  };
}

function printBody(label: string, body: SerializedBody): void {
  if (body.kind === 'empty') return;
  if (body.kind === 'json') console.log(`${pc.dim(`${label}:`)} ${JSON.stringify(body.value)}`);
  else if (body.kind === 'text') console.log(`${pc.dim(`${label}:`)} ${body.text}`);
  else console.log(pc.dim(`${label}: [binary ${body.size} bytes${body.truncated ? ', truncated' : ''}]`));
}

function kindColor(kind: ExecutableEntity['kind']) {
  return kind === 'rest' ? pc.cyan : kind === 'graphql' ? pc.magenta : pc.blue;
}

function printJson(value: object): void {
  console.log(JSON.stringify(value, null, 2));
}
