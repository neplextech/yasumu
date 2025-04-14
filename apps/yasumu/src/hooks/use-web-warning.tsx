'use client';

import { Button } from '@/components/ui/button';
import { YasumuSocials } from '@/lib/constants/socials';
import { isNative } from '@/lib/common/utils';
import Link from 'next/link';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useWebWarning() {
  useEffect(() => {
    const webWarning = localStorage.getItem('web-warning-dismissed');

    if (!isNative() && !webWarning) {
      const toastInfo = toast.info('You are using the web version of Yasumu.', {
        duration: 10000,
        dismissible: true,
        className: 'select-none',
        onDismiss() {
          localStorage.setItem('web-warning-dismissed', 'true');
        },
        description: (
          <div className="space-y-2">
            <p>
              The web version may not have all the features of the native version. Please use the native version for the
              best experience.
            </p>
            <div className="flex gap-4">
              <Link href={YasumuSocials.Download} target="_blank">
                <Button size="sm">Download</Button>
              </Link>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  localStorage.setItem('web-warning-dismissed', 'true');
                  toast.dismiss(toastInfo);
                }}
              >
                Don{"'"}t show again
              </Button>
            </div>
          </div>
        ),
      });
    }
  }, []);
}
