import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { rpcServer } from '../../rpc/rpc-server.ts';
import { runInTransaction } from '../../database/index.ts';

const yasumuRpcPayloadSchema = z.object({
  context: z.object({
    workspaceId: z.string().nullable(),
  }),
  command: z.object({
    command: z.string(),
    parameters: z.array(z.unknown()),
    type: z.enum(['query', 'mutation']),
  }),
});

export const yasumuRpcRoute = new Hono().post(
  '/',
  zValidator('json', yasumuRpcPayloadSchema),
  async (c) => {
    const { context, command } = c.req.valid('json');

    try {
      const result = await runInTransaction(() =>
        rpcServer.execute(
          {
            type: command.type,
            action: command.command,
            payload: command.parameters,
          },
          context,
        ),
      );

      return c.json({ result: result === undefined ? {} : result });
    } catch (error) {
      if (Error.isError(error) && error.message === 'DEN_HANDLER_NOT_FOUND') {
        return c.json(
          {
            error: {
              message: `Command ${command.command} not found`,
            },
          },
          404,
        );
      }

      throw error;
    }
  },
);
