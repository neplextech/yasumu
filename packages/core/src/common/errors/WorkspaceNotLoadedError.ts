export class WorkspaceNotLoadedError extends Error {
  public readonly name = 'WorkspaceNotLoadedError';

  public constructor() {
    super(
      'Workspace not loaded. Did you forget to call `yasumu.workspace.loadMetadata()`?',
    );

    Error.captureStackTrace(this, WorkspaceNotLoadedError);
  }
}
