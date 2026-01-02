'use client';
import { event, app } from '@tauri-apps/api';
import { useEffect } from 'react';
import { toast } from '@yasumu/ui/components/sonner';
import { invoke } from '@tauri-apps/api/core';
import { EmailData, SubscriptionEventPayload } from '@yasumu/core';

export interface TanxiumEvent<T = unknown> {
  type: 'console' | 'show-notification' | 'message';
  payload: T;
}

export function useTanxiumEvent() {
  useEffect(() => {
    (globalThis as any).emitEvent = (e: any) => {
      invoke('tanxium_send_event', { data: JSON.stringify(e) });
    };
    const remove = event.listen<string>('tanxium-event', async (event) => {
      try {
        const data = JSON.parse(event.payload) as TanxiumEvent;

        switch (data.type) {
          case 'console':
            {
              const _data = data.payload as { msg: string; level: number };
              const levelToConsoleMap = {
                0: 'log',
                2: 'info',
                3: 'warn',
                4: 'error',
              };

              // @ts-ignore
              (console[levelToConsoleMap[_data.level]] || console.log)(
                _data.msg,
              );
            }
            break;
          case 'show-notification':
            {
              const notificationData = data.payload as {
                title: string;
                message: string;
                variant?: 'default' | 'success' | 'warning' | 'info' | 'error';
                link?: string;
              };

              switch (notificationData.variant) {
                case 'success':
                case 'warning':
                case 'error':
                case 'info':
                  toast[notificationData.variant](notificationData.title, {
                    description: notificationData.message,
                  });
                  break;
                default:
                  toast(notificationData.title, {
                    description: notificationData.message,
                  });
              }
            }
            break;
          case 'message': {
            console.log({ data });
            // TODO: handle other message types
            if (!(data.payload && typeof data.payload === 'object')) return;
            if (
              'type' in data.payload &&
              data.payload.type === 'yasumu-subscription'
            ) {
              const messageData = data.payload as {
                type: 'yasumu-subscription';
                data: SubscriptionEventPayload;
              };

              if (!globalThis.yasumu) return;

              await globalThis.yasumu.onSubscription(messageData.data);
            }

            if (
              'event' in data.payload &&
              data.payload.event === 'new-email' &&
              'data' in data.payload
            ) {
              const messageData = data.payload.data as {
                workspaceId: string;
                newEmail: EmailData;
              };

              if (!globalThis.yasumu) return;

              globalThis.yasumu.events.emit(
                'onNewEmail',
                messageData.workspaceId,
                messageData.newEmail,
              );
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse tanxium event', error);
      }
    });

    return () => {
      remove.then((remove) => remove());
    };
  }, []);
}
