import { createParamDecorator } from '@yasumu/den';
import { YasumuRpcContext } from '@yasumu/rpc';
import { NotFoundException } from './exceptions/http.exception.ts';

export const WorkspaceId = createParamDecorator((_data, ctx) => {
  const context = ctx.context as YasumuRpcContext;

  if (!context.workspaceId) {
    throw new NotFoundException('Active workspace not found');
  }

  return context.workspaceId;
});
