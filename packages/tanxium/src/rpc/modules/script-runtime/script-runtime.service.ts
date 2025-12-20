import { Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { ScriptableEntity } from '@yasumu/common';
import { restEntities } from '../../../database/schema.ts';
import { and, eq } from 'drizzle-orm';
import { NotFoundException } from '../common/exceptions/http.exception.ts';
import { runInNewContext, createContext, type Context } from 'node:vm';

interface RunnableContext {
  onRequest?: (req: Request) => Promise<void>;
  onResponse?: (req: Request, res: Response) => Promise<void>;
}

@Injectable()
export class ScriptRuntimeService {
  private context: Context | null = null;
  public constructor(private readonly connection: TransactionalConnection) {}

  private getContext() {
    if (this.context) return this.context;

    this.context = createContext({
      Yasumu,
      inEmbeddedScript: true,
    });

    return this.context;
  }

  private async getScriptCode(workspaceId: string, entity: ScriptableEntity) {
    const db = this.connection.getConnection();

    const result = await (async () => {
      switch (entity.type) {
        case 'rest': {
          const [result] = await db
            .select()
            .from(restEntities)
            .where(
              and(
                eq(restEntities.workspaceId, workspaceId),
                eq(restEntities.id, entity.id),
              ),
            );

          return result;
        }
        default:
          throw new NotFoundException(
            `Entity type ${entity.type} is not supported yet`,
          );
      }
    })();

    if (!result) {
      throw new NotFoundException(
        `Entity ${entity.id} for workspace ${workspaceId} not found`,
      );
    }

    return result.script;
  }

  public async executeScript(workspaceId: string, entity: ScriptableEntity) {
    const script = await this.getScriptCode(workspaceId, entity);
    if (!script) return null;

    const context = runInNewContext(script.code, this.getContext(), {
      timeout: 60_000,
      filename: `yasumu-embedded-script/${entity.type}/${entity.id}.js`,
    }) as RunnableContext;

    if (entity.target === 'onRequest' && context.onRequest !== undefined) {
      const req = entity.serializedData.request;
      await context.onRequest(
        new Request(req.url, {
          method: req.method,
          headers: req.headers,
        }),
      );
    }

    if (entity.target === 'onResponse' && context.onResponse !== undefined) {
      const res = entity.serializedData.response;
      if (!res) return;
      const req = entity.serializedData.request;

      await context.onResponse(
        new Request(req.url, {
          method: req.method,
          headers: req.headers,
        }),
        new Response(res.body, {
          status: res.status,
          headers: res.headers,
        }),
      );
    }
  }
}
