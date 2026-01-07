import { create } from 'zustand';
import { Environment } from '@yasumu/core';
import { env } from 'process';

export interface EnvironmentStore {
  environments: Environment[];
  selectedEnvironment: Environment | null;
  setEnvironments: (environments: Environment[]) => void;
  setSelectedEnvironment: (environment: Environment | null) => void;
  interpolate: <T extends string | File>(str: T) => T;
  updateEnvironment: (
    envId: Environment['id'],
    environment: Partial<Environment>,
  ) => void;
}

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  environments: [],
  selectedEnvironment: null,
  setEnvironments: (environments) => {
    set((store) => {
      return {
        environments,
        selectedEnvironment: store.selectedEnvironment
          ? environments.find(
              (env) => env.id === store.selectedEnvironment?.id,
            ) || null
          : null,
      };
    });
  },
  updateEnvironment: (envId, environment) => {
    set((store) => {
      const updatedEnvironments = store.environments.map((env) =>
        env.id === envId ? ({ ...env, ...environment } as Environment) : env,
      );

      return {
        environments: updatedEnvironments,
        selectedEnvironment:
          store.selectedEnvironment?.id === envId
            ? ({ ...store.selectedEnvironment, ...environment } as Environment)
            : store.selectedEnvironment,
      };
    });
  },

  setSelectedEnvironment: (environment) =>
    set({ selectedEnvironment: environment }),
  interpolate: (str) =>
    (typeof str !== 'string'
      ? str
      : (get().selectedEnvironment?.interpolate(str) ?? str)) as typeof str,
}));
