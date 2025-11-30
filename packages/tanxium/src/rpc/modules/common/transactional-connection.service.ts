import { Injectable } from '@yasumu/den';
import { db, TransactionContext } from '@/database/index.ts';

@Injectable()
export class TransactionalConnection {
  public getConnection() {
    const ctx = TransactionContext.getStore();
    return ctx?.transaction ?? db;
  }
}
