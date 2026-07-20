import { describe, expect, it } from 'vitest';

import { Interpolator, parseDotenv, resolveEnvironment, SecretRedactor, YasumuError } from '../src/index.js';
import { environment } from './fixtures.js';

describe('Interpolator', () => {
  it('preserves typed exact values and recursively resolves strings', () => {
    const interpolator = new Interpolator({
      variables: {
        port: 443,
        enabled: true,
        base: 'https://example.test',
        endpoint: '{{base}}/v1',
      },
    });

    expect(interpolator.interpolateString('{{port}}')).toBe(443);
    expect(interpolator.interpolate({ url: '{{endpoint}}', enabled: '{{enabled}}' })).toEqual({
      url: 'https://example.test/v1',
      enabled: true,
    });
    expect(interpolator.interpolateString('literal \\{{base}}')).toBe('literal {{base}}');
  });

  it('supports explicit variable and secret namespaces used by editor completions', () => {
    const interpolator = new Interpolator({
      variables: { region: 'eu-west' },
      secrets: { TOKEN: 'secret-token' },
    });

    expect(interpolator.interpolateString('{{variables.region}}')).toBe('eu-west');
    expect(interpolator.interpolateString('Bearer {{secrets.TOKEN}}')).toBe('Bearer secret-token');
  });

  it('classifies missing values and cycles predictably', () => {
    expect(new Interpolator({}, { missing: 'preserve' }).interpolateString('{{missing}}')).toBe('{{missing}}');
    expect(new Interpolator({}, { missing: 'empty' }).interpolateString('x{{missing}}y')).toBe('xy');
    expect(() => new Interpolator({ variables: { a: '{{b}}', b: '{{a}}' } }).interpolateString('{{a}}')).toThrow(
      YasumuError,
    );
    expect(() => new Interpolator({}).interpolateString('{{missing}}')).toThrow(/Missing interpolation value/);
  });
});

describe('environment resolution', () => {
  it('applies documented precedence and keeps secrets separate', () => {
    const resolved = resolveEnvironment({
      workspaceDefaults: { region: 'default', untouched: 1 },
      environment: environment({
        variables: [
          { key: 'region', value: 'environment', enabled: true },
          { key: 'disabled', value: 'ignored', enabled: false },
        ],
        secrets: [{ key: 'TOKEN', enabled: true }],
      }),
      dotenv: { region: 'dotenv', TOKEN: 'dotenv-token' },
      process: { region: 'process', YASUMU_ENV_TOKEN: 'process-token' },
      providedSecrets: { TOKEN: 'provider-token' },
      cliVariables: { region: 'cli' },
      cliSecrets: { TOKEN: 'cli-token' },
      executionVariables: { region: 'execution' },
      executionSecrets: { TOKEN: 'execution-token' },
      requireSecrets: true,
    });

    expect(resolved.snapshot.variables).toEqual({ region: 'execution', untouched: 1 });
    expect(resolved.snapshot.secrets).toEqual({ TOKEN: 'execution-token' });
    expect(resolved.redactor.redact('Bearer execution-token')).toBe('Bearer [REDACTED]');
  });

  it('parses dotenv quoting, comments, exports, and newlines', () => {
    expect(parseDotenv("A=plain # comment\nexport B='quoted value'\nC=hello\\nworld\n# ignored")).toEqual({
      A: 'plain',
      B: 'quoted value',
      C: 'hello\nworld',
    });
  });

  it('redacts nested serialized values without leaking partial secrets', () => {
    const redactor = new SecretRedactor(['short', 'short-secret']);
    expect(
      redactor.redactValue({
        message: 'short-secret / short',
        'short-secret-key': true,
        nested: ['short-secret'],
      }),
    ).toEqual({
      message: '[REDACTED] / [REDACTED]',
      '[REDACTED]-key': true,
      nested: ['[REDACTED]'],
    });
  });
});
