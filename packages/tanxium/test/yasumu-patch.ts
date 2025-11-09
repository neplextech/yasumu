// @ts-nocheck testing
import { StatementSync } from 'node:sqlite';

// patch StatementSync to enable `setReturnArrays(boolean)` if it is not supported
if (!('setReturnArrays' in StatementSync.prototype)) {
  const originalAll = StatementSync.prototype.all;
  const originalGet = StatementSync.prototype.get;

  StatementSync.prototype.setReturnArrays = function (returnArrays: boolean) {
    this.__returnArrays = !!returnArrays;
    return this;
  };

  StatementSync.prototype.all = function (...args: any[]) {
    const rows = originalAll.apply(this, args);
    if (this.__returnArrays && rows && Array.isArray(rows)) {
      // convert {col:value} → [value, value, ...]
      return rows.map((row) => Object.values(row));
    }
    return rows;
  };

  StatementSync.prototype.get = function (...args: any[]) {
    const row = originalGet.apply(this, args);
    if (this.__returnArrays && row && typeof row === 'object') {
      return Object.values(row);
    }
    return row;
  };
}

if (typeof Yasumu === 'undefined') {
  globalThis.Yasumu = {
    getResourcesDir() {
      return Deno.cwd() + '/prisma';
    },
    setRpcPort(port: number) {
      console.log('Yasumu.setRpcPort', port);
    },
  } as typeof Yasumu;
}
