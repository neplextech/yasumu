import { rendererEventQueue, isWorkerEnvironment } from './utils.ts';
import { op_show_confirmation_dialog_sync } from 'ext:core/ops';

export interface CreateYasumuNotification {
  /**
   * The title of the notification
   */
  title: string;
  /**
   * The message of the notification
   */
  message: string;
  /**
   * The variant of the notification
   */
  variant?: 'default' | 'success' | 'warning' | 'info' | 'error';
  /**
   * The link to open when the notification is clicked
   */
  link?: string;
}

export interface CreateYasumuConfirmationDialog {
  /**
   * The title of the dialog
   */
  title: string;
  /**
   * The message of the dialog
   */
  message: string;
  /**
   * The label of the yes button
   */
  yesLabel: string;
  /**
   * The label of the no button
   */
  noLabel: string;
  /**
   * The label of the cancel button
   */
  cancelLabel: string;
}

/**
 * Yasumu UI API
 */
export class YasumuUI {
  private constructor() {
    throw new Error('YasumuUI is not a constructor');
  }

  public static showConfirmationDialogSync(
    dialog: CreateYasumuConfirmationDialog,
  ) {
    // TODO: maybe allow workers to show confirmation dialogs?
    if (isWorkerEnvironment()) return false;

    const { title, message, yesLabel, noLabel, cancelLabel } = dialog;

    return op_show_confirmation_dialog_sync(
      title,
      message,
      yesLabel,
      noLabel,
      cancelLabel,
    );
  }

  /**
   * Show a toast notification in the ui
   * @param notification The notification to show
   */
  public static showNotification(notification: CreateYasumuNotification) {
    return rendererEventQueue.enqueue({
      type: 'show-notification',
      payload: notification,
    });
  }
}
