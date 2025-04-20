export interface OpenDialogOptions {
  canCreateDirectories?: boolean;
  defaultPath?: string;
  directory?: boolean;
  filters?: DialogFilter[];
  multiple?: boolean;
  recursive?: boolean;
  title?: string;
}

export interface SaveDialogOptions {
  canCreateDirectories?: boolean;
  defaultPath?: string;
  filters?: DialogFilter[];
  title?: string;
}

export interface DialogFilter {
  extensions: string[];
  name: string;
}

export interface FileResponse {
  base64Data?: string;
  duration?: number;
  height?: number;
  mimeType?: string;
  modifiedAt?: number;
  name?: string;
  path: string;
  size: number;
  width?: number;
}

export type OpenDialogReturn<T extends OpenDialogOptions> =
  T['directory'] extends true
    ? T['multiple'] extends true
      ? string[] | null
      : string | null
    : T['multiple'] extends true
      ? FileResponse[] | null
      : FileResponse | null;

export interface DialogCommon {
  open<T extends OpenDialogOptions>(options?: T): Promise<OpenDialogReturn<T>>;
  save(options?: SaveDialogOptions): Promise<string | null>;
}
