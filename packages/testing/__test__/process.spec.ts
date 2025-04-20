import { describe, expect, test, vi } from 'vitest';
import { yasumu } from '../src';

describe('Process', () => {
  test('should define an exit method', async () => {
    const processExitSpy = vi
      .spyOn(yasumu.process, 'exit')
      .mockImplementation(() => {
        return Promise.resolve();
      });

    await yasumu.process.exit(0);

    expect(processExitSpy).toHaveBeenCalledTimes(1);
    expect(processExitSpy).toHaveBeenCalledWith(0);

    processExitSpy.mockRestore();
  });

  test('should define a relaunch method', async () => {
    const relaunchSpy = vi.spyOn(yasumu.process, 'relaunch');

    await yasumu.process.relaunch();

    expect(relaunchSpy).toHaveBeenCalledTimes(1);
  });
});
