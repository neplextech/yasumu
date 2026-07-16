import type { PermissionProvider } from '@yasumu/headless';
import type { PermissionRequest } from '@yasumu/runtime-api';

export interface GuiConfirmationDialog {
  title: string;
  message: string;
  yesLabel: string;
  noLabel: string;
  cancelLabel: string;
}

export type GuiConfirmationHandler = (dialog: GuiConfirmationDialog) => boolean;

/** Keeps permission decisions blocking while delegating the UI to the native host. */
export class GuiPermissionProvider implements PermissionProvider {
  public constructor(private readonly confirm: GuiConfirmationHandler = showNativeConfirmation) {}

  // The port is asynchronous even though the desktop confirmation is intentionally blocking.
  // deno-lint-ignore require-await
  public async request(request: PermissionRequest, signal: AbortSignal): Promise<boolean> {
    signal.throwIfAborted();
    const details = [request.reason, request.resource ? `Resource: ${request.resource}` : undefined].filter(Boolean);
    const granted = this.confirm({
      title: `Allow ${formatCapability(request.capability)}?`,
      message: details.length > 0 ? details.join('\n\n') : 'A Yasumu script requested this capability.',
      yesLabel: 'Allow',
      noLabel: 'Deny',
      cancelLabel: 'Deny',
    });
    signal.throwIfAborted();
    return granted;
  }
}

function showNativeConfirmation(dialog: GuiConfirmationDialog): boolean {
  return Yasumu.ui.showConfirmationDialogSync(dialog);
}

function formatCapability(capability: PermissionRequest['capability']): string {
  return capability.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}
