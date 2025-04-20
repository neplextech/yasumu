import { describe, beforeAll, expect, test } from 'vitest';
import { CommandsMock, yasumu, CommandInterceptor } from '../src';

describe('Commands Mock', () => {
  const command = yasumu.command;
  new CommandInterceptor('ping').intercept(() => {
    return 'Pong!';
  });

  test('should add plugin listener', async () => {
    const listener = await command.addPluginListener(
      'plugin',
      'event',
      () => {},
    );
    expect(listener.channelId).toBe(0);
    expect(listener.event).toBe('event');
    expect(listener.plugin).toBe('plugin');
  });

  test('should invoke command', async () => {
    const result = await command.invoke('ping');
    expect(result).toBe('Pong!');
  });

  test('should throw error to  handle non-existent command ', async () => {
    expect(yasumu.command.invoke('unknown')).rejects.toThrowError(
      'Command unknown not found',
    );
  });
});
