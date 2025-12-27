import { create } from 'zustand';
import { Environment } from '@yasumu/core';

export interface EnvironmentStore {
  environments: Environment[];
  selectedEnvironment: Environment | null;
  setEnvironments: (environments: Environment[]) => void;
  setSelectedEnvironment: (environment: Environment | null) => void;
  interpolate: <T extends string | File>(str: T) => T;
}

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  environments: [],
  selectedEnvironment: null,
  setEnvironments: (environments) => set({ environments }),
  setSelectedEnvironment: (environment) =>
    set({ selectedEnvironment: environment }),
  interpolate: (str) =>
    (typeof str !== 'string'
      ? str
      : (get().selectedEnvironment?.interpolate(str) ?? str)) as typeof str,
}));
