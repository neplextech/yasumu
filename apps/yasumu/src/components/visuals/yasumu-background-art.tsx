import React from 'react';

import YasumuLogo from './yasumu-logo';

export default function YasumuBackgroundArt({ message }: { message: string }) {
  return (
    <div className="absolute -z-10 flex flex-col items-center justify-center opacity-10 select-none">
      <YasumuLogo className="invert dark:invert-0" height={256} width={256} />
      <h1 className="font-bold md:text-4xl lg:text-6xl xl:text-8xl">{message}</h1>
    </div>
  );
}
