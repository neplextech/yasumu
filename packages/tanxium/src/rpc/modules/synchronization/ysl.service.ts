import { Injectable } from '@yasumu/den';
import {
  serialize,
  deserialize,
  type AnyYasumuSchema,
  type Infer,
} from '@yasumu/schema';

@Injectable()
export class YslService {
  public serialize<T extends AnyYasumuSchema>(schema: T, value: Infer<T>) {
    return serialize(value, schema);
  }

  public deserialize<T extends AnyYasumuSchema>(schema: T, content: string) {
    return deserialize(content, schema);
  }

  public async emit(content: string, path: string) {
    await Deno.writeTextFile(path, content);
  }
}
