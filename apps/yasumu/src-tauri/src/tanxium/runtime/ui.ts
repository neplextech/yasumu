import { rendererEventQueue } from './utils.ts';

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

/**
 * Yasumu UI API
 */
export class YasumuUI {
  private constructor() {
    throw new Error('YasumuUI is not a constructor');
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
