'use client';
import { createContext, useContext, useState } from 'react';

interface OutputResponse {
  status: number;
  statusText: string;
  time: number;
  headers: Record<string, string>;
  body: string;
  raw: string;
}

interface RestOutputContextData {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  output: OutputResponse | null;
  setOutput: (output: OutputResponse | null) => void;
}

const RestOutputContext = createContext<RestOutputContextData | null>(null);

export function RestOutputProvider({ children }: React.PropsWithChildren) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [output, setOutput] = useState<OutputResponse | null>(null);

  return (
    <RestOutputContext.Provider
      value={{ isLoading, setIsLoading, output, setOutput }}
    >
      {children}
    </RestOutputContext.Provider>
  );
}

export function useRestOutput() {
  const context = useContext(RestOutputContext);

  if (!context) {
    throw new Error(
      'useRestOutput() must be used within a <RestOutputProvider />',
    );
  }

  return context;
}
