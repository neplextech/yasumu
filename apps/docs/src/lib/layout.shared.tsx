import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import React from 'react';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <img
            src="https://github.com/yasumu-org.png"
            alt="Yasumu Logo"
            className="w-6 h-6 rounded-md"
          />
          <span className="font-bold">Yasumu</span>
        </div>
      ),
    },
    githubUrl: 'https://github.com/neplextech/yasumu',
  };
}
