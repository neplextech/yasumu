import { op_send_renderer_event } from 'ext:core/ops';

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
}

/**
 * Yasumu UI API
 */
export const YasumuUI = {
  /**
   * Show a toast notification in the ui
   * @param notification The notification to show
   */
  showNotification(notification: CreateYasumuNotification): void {
    op_send_renderer_event(
      JSON.stringify({
        type: 'show-notification',
        payload: notification,
      }),
    );
  },
};
