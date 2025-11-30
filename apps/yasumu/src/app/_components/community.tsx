import React from 'react';
import { YasumuSocials } from '@/lib/constants/socials';
import Link from 'next/link';
import { BsDiscord, BsGithub } from 'react-icons/bs';

export default function Community() {
  return (
    <div className="pt-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
        Community
      </h3>
      <div className="flex gap-4">
        <Link
          href={YasumuSocials.GitHub as any}
          target="_blank"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BsGithub className="size-4" />
          GitHub
        </Link>
        <Link
          href={YasumuSocials.Discord as any}
          target="_blank"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BsDiscord className="size-4" />
          Discord
        </Link>
      </div>
    </div>
  );
}
