import { HTTPException } from 'hono/http-exception';

export class NotFoundException extends HTTPException {
  public constructor(message?: string) {
    super(404, { message: message || 'RESOURCE_NOT_FOUND' });
  }
}
