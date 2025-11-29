import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { yasumuRpcServer } from '../../rpc/yasumu-rpc-server.ts';
import { z } from 'zod';

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

    const result = await yasumuRpcServer.handler(context, {
      ...command,
      // @ts-expect-error override isType
      isType(t) {
        return t === command.command;
      },
    });

    return c.json(result);
  },
);
