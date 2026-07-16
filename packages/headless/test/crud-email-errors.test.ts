import type {
  RuntimeCapabilities,
  RuntimeHostCallHandler,
  ScriptHookInvocation,
  YasumuScriptRuntime,
} from '@yasumu/runtime-api';
import {
  EmailHookService,
  EntityCrudService,
  InMemoryEntityRepository,
  InMemoryWorkspaceRepository,
  serializeYasumuError,
  WorkspaceCrudService,
  YasumuError,
  YasumuErrorCodes,
} from '../src/index.js';
import { describe, expect, it } from 'vitest';

import { environment, graphqlEntity, group, restEntity, script, workspace } from './fixtures.js';

describe('headless CRUD services', () => {
  it('validates references, preserves IDs, and emits domain events', async () => {
    const fixture = workspace({ groups: [group()], entities: [] });
    const workspaces = new InMemoryWorkspaceRepository([fixture]);
    const events: unknown[] = [];
    const entities = new EntityCrudService(new InMemoryEntityRepository(workspaces), workspaces, {
      emit: (event) => void events.push(event),
    });
    const entity = restEntity({ groupId: 'group-1' });

    await expect(entities.create(fixture.id, entity)).resolves.toEqual(entity);
    await expect(entities.create(fixture.id, entity)).rejects.toMatchObject({ code: YasumuErrorCodes.DuplicateEntityId });
    const updated = { ...entity, name: 'Updated' };
    await expect(entities.update(fixture.id, entity.id, updated)).resolves.toEqual(updated);
    await expect(entities.update(fixture.id, entity.id, { ...updated, id: 'replacement-id' })).rejects.toMatchObject({
      code: YasumuErrorCodes.InvalidReference,
    });
    await expect(
      entities.update(fixture.id, entity.id, graphqlEntity({ id: entity.id })),
    ).rejects.toMatchObject({ code: YasumuErrorCodes.InvalidEntity });
    await entities.delete(fixture.id, entity.id);

    expect(events).toEqual([
      expect.objectContaining({ type: 'entity-created', workspaceId: fixture.id }),
      expect.objectContaining({ type: 'entity-updated', previousId: entity.id }),
      expect.objectContaining({ type: 'entity-deleted', entityId: entity.id }),
    ]);
  });

  it('manages environments, group hierarchy, workspace scripts, and SMTP configuration', async () => {
    const fixture = workspace({ entities: [], groups: [group({ id: 'parent' })] });
    const repository = new InMemoryWorkspaceRepository([fixture]);
    const service = new WorkspaceCrudService(repository);

    const active = environment({ id: 'active' });
    await service.upsertEnvironment(fixture.id, active);
    await service.upsertGroup(fixture.id, group({ id: 'child', parentId: 'parent' }));
    await service.setWorkspaceScript(fixture.id, script('workspace-hook'));
    await service.setSmtp(fixture.id, { id: 'smtp', port: 2525, origin: { kind: 'memory' } });
    const saved = await repository.get(fixture.id);
    expect(saved).toMatchObject({
      script: { id: 'workspace-hook' },
      smtp: { id: 'smtp', port: 2525 },
      groups: expect.arrayContaining([expect.objectContaining({ id: 'child', parentId: 'parent' })]),
      environments: [expect.objectContaining({ id: 'active' })],
    });

    await expect(service.deleteGroup(fixture.id, 'parent')).rejects.toMatchObject({
      code: YasumuErrorCodes.InvalidReference,
    });
    await expect(service.upsertGroup(fixture.id, group({ id: 'parent', parentId: 'child' }))).rejects.toMatchObject({
      code: YasumuErrorCodes.InvalidReference,
    });
    await service.deleteGroup(fixture.id, 'child');
    await service.deleteEnvironment(fixture.id, 'active');
    expect((await repository.get(fixture.id))?.groups.map((entry) => entry.id)).toEqual(['parent']);
  });

  it('prevents deleting referenced entities', async () => {
    const dependency = restEntity({ id: 'dependency' });
    const consumer = restEntity({ id: 'consumer', dependencies: ['dependency'] });
    const fixture = workspace({ entities: [dependency, consumer] });
    const repository = new InMemoryWorkspaceRepository([fixture]);
    await expect(new InMemoryEntityRepository(repository).delete(fixture.id, dependency.id)).rejects.toMatchObject({
      code: YasumuErrorCodes.InvalidReference,
    });
  });
});

describe('structured errors', () => {
  it('serializes nested causes and diagnostics without relying on Error.cause support', () => {
    const error = new YasumuError(YasumuErrorCodes.InvalidEntity, 'outer', {
      entityId: 'entity',
      cause: new YasumuError(YasumuErrorCodes.InvalidReference, 'inner'),
    });
    expect(error.toDiagnostic()).toMatchObject({ code: YasumuErrorCodes.InvalidEntity, entityId: 'entity' });
    expect(serializeYasumuError(error)).toMatchObject({
      code: YasumuErrorCodes.InvalidEntity,
      cause: { code: YasumuErrorCodes.InvalidReference, message: 'inner' },
    });
  });
});

describe('email hook lifecycle', () => {
  it('cascades workspace and SMTP onEmail hooks with structured mail and redaction', async () => {
    const invocations: ScriptHookInvocation[] = [];
    const runtime: YasumuScriptRuntime = {
      kind: 'email-test',
      capabilities: capabilities(),
      async createSession() {
        return {
          async invokeHook(invocation) {
            invocations.push(invocation);
            return {
              environment: invocation.environment,
              tests: [],
              diagnostics: [],
              logs: [
                {
                  level: 'info',
                  message: `received ${invocation.email?.subject} with ${invocation.environment.secrets.TOKEN}`,
                  timestamp: 1,
                },
              ],
            };
          },
          dispose: async () => undefined,
        };
      },
    };
    const fixture = workspace({
      script: script('workspace-email'),
      smtp: { id: 'smtp', port: 2525, script: script('smtp-email'), origin: { kind: 'memory' } },
      activeEnvironmentId: 'mail-environment',
      environments: [
        environment({
          id: 'mail-environment',
          variables: [{ key: 'MAILBOX', value: 'user@example.test', enabled: true }],
          secrets: [{ key: 'TOKEN', enabled: true }],
        }),
      ],
    });
    const hostCall = (async () => {
      throw new Error('not used');
    }) as RuntimeHostCallHandler;
    const result = await new EmailHookService({
      workspaces: new InMemoryWorkspaceRepository([fixture]),
      runtime,
      hostCall,
      secrets: { resolve: async () => ({ TOKEN: 'mail-secret' }) },
    }).handle(fixture.id, {
      id: 'mail-1',
      from: 'sender@example.test',
      to: ['user@example.test'],
      cc: [],
      subject: 'Welcome',
      html: '<p>Welcome</p>',
      text: 'Welcome',
      createdAt: 10,
    });

    expect(invocations.map((invocation) => `${invocation.hook}:${invocation.source.id}`)).toEqual([
      'onEmail:workspace-email',
      'onEmail:smtp-email',
    ]);
    expect(invocations[0]?.email?.id).toBe('mail-1');
    expect(result.status).toBe('completed');
    expect(JSON.stringify(result)).not.toContain('mail-secret');
    expect(result.logs[0]?.message).toBe('received Welcome with [REDACTED]');
    expect(invocations.every((invocation) => invocation.environment.variables.MAILBOX === 'user@example.test')).toBe(true);
  });

  it('stops the email cascade when a script cancels', async () => {
    const invocations: ScriptHookInvocation[] = [];
    const runtime: YasumuScriptRuntime = {
      kind: 'email-cancellation-test',
      capabilities: capabilities(),
      async createSession() {
        return {
          async invokeHook(invocation) {
            invocations.push(invocation);
            return {
              environment: invocation.environment,
              tests: [],
              diagnostics: [],
              logs: [],
              cancelled: true,
              cancelReason: 'mail rejected',
            };
          },
          dispose: async () => undefined,
        };
      },
    };
    const fixture = workspace({
      script: script('workspace-email'),
      smtp: { id: 'smtp', port: 2525, script: script('smtp-email'), origin: { kind: 'memory' } },
    });
    const result = await new EmailHookService({
      workspaces: new InMemoryWorkspaceRepository([fixture]),
      runtime,
      hostCall: (async () => undefined) as RuntimeHostCallHandler,
    }).handle(fixture.id, {
      id: 'mail-2',
      from: 'sender@example.test',
      to: ['user@example.test'],
      cc: [],
      subject: 'cancel',
      html: '',
      text: '',
      createdAt: 1,
    });

    expect(result).toMatchObject({
      status: 'cancelled',
      error: { code: YasumuErrorCodes.ExecutionCancelled, message: 'mail rejected' },
    });
    expect(invocations).toHaveLength(1);
  });
});

function capabilities(): RuntimeCapabilities {
  return {
    workers: false,
    nodeBuiltins: false,
    filesystemRead: false,
    filesystemWrite: false,
    network: false,
    environment: false,
    subprocess: false,
    ffi: false,
    nativeModules: false,
    virtualModules: true,
    workspaceFiles: false,
    email: true,
    nestedExecution: false,
  };
}
