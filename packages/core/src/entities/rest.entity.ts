import type { RestService } from '@/services/rest.service.js';

export class RestEntity {
  public constructor(public readonly restService: RestService) {}
}
