export const ExternalWorkspaceImportStrategy = {
  Postman: 'postman',
} as const;

export type ExternalWorkspaceImportStrategy =
  (typeof ExternalWorkspaceImportStrategy)[keyof typeof ExternalWorkspaceImportStrategy];

export interface ExternalWorkspaceImportOptions {
  strategy: 'postman';
  content: string;
}

export interface ExternalWorkspaceExportOptions {
  strategy: 'postman';
}
