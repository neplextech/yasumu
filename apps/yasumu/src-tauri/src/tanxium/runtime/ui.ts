import { op_send_renderer_event } from 'ext:core/ops';

export interface CreateYasumuNotification {
  title: string;
  message: string;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'error';
}

export const YasumuUI = {
  showNotification(notification: CreateYasumuNotification): void {
    op_send_renderer_event(
      JSON.stringify({
        type: 'show-notification',
        payload: notification,
      }),
    );
  },
};
