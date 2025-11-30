import { Injectable } from '@yasumu/den';
import { TransactionalConnection } from '../common/transactional-connection.service.ts';
import { mapResult } from '@/database/common/index.ts';
import { rest } from '@/database/schema.ts';
import { eq } from 'drizzle-orm';

@Injectable()
export class RestService {
  public constructor(private readonly connection: TransactionalConnection) {}

  public async findOneByWorkspaceId(workspaceId: string) {
    const db = this.connection.getConnection();
    const result = await db.query.rest.findFirst({
      where: eq(rest.workspaceId, workspaceId),
    });
    return result ? mapResult(result) : null;
  }

  public async list(workspaceId: string) {
    const db = this.connection.getConnection();
    const result = await db.query.restEntities.findMany({
      where: eq(rest.workspaceId, workspaceId),
    });

    return mapResult(result);
  }
}
