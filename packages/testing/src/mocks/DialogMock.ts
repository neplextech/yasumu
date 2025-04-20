import type {
  DialogCommon,
  OpenDialogOptions,
  OpenDialogReturn,
  SaveDialogOptions,
} from '@yasumu/common';

export class DialogMock implements DialogCommon {
  public async open<T extends OpenDialogOptions>(
    options?: T,
  ): Promise<OpenDialogReturn<T>> {
    return null;
  }

  public async save(options?: SaveDialogOptions): Promise<string | null> {
    return null;
  }
}
