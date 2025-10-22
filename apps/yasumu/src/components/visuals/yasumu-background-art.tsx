import React from 'react';
import YasumuLogo from './yasumu-logo';

export default function YasumuBackgroundArt({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center opacity-10 -z-10 absolute select-none">
      <YasumuLogo className="dark:invert-0 invert" height={256} width={256} />
      <h1 className="font-bold md:text-4xl lg:text-6xl xl:text-8xl">
        {message}
      </h1>
    </div>
  );
}
