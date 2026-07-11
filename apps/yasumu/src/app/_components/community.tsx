import Link from 'next/link';
import React from 'react';
import { BsDiscord, BsGithub } from 'react-icons/bs';

import { YasumuSocials } from '@/lib/constants/socials';

export default function Community() {
  return (
    <div className="pt-4">
      <h3 className="text-muted-foreground mb-4 text-sm font-medium tracking-wider uppercase">Community</h3>
      <div className="flex gap-4">
        <Link
          href={YasumuSocials.GitHub as any}
          target="_blank"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
        >
          <BsGithub className="size-4" />
          GitHub
        </Link>
        <Link
          href={YasumuSocials.Discord as any}
          target="_blank"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
        >
          <BsDiscord className="size-4" />
          Discord
        </Link>
      </div>
    </div>
  );
}
