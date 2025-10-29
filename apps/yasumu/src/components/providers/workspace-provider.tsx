'use client';

import React, { createContext } from 'react';

const YasumuContext = createContext<null>(null);

export default function WorkspaceProvider({
  children,
}: React.PropsWithChildren) {
  return (
    <YasumuContext.Provider value={null}>{children}</YasumuContext.Provider>
  );
}
