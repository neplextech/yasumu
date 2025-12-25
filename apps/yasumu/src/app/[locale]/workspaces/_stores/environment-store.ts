import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// TODO: move to @yasumu/common package
export interface Variable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: Variable[];
  secrets: Variable[];
}

export interface EnvironmentStore {
  environments: Environment[];
  selectedEnvironmentId: string | null;
  setEnvironments: (environments: Environment[]) => void;
  setSelectedEnvironmentId: (id: string | null) => void;
  getSelectedEnvironment: () => Environment | undefined;
  addEnvironment: (environment: Environment) => void;
  deleteEnvironment: (id: string) => void;
  updateEnvironment: (environment: Environment) => void;
  setVariables: (id: string, variables: Variable[]) => void;
  setSecrets: (id: string, secrets: Variable[]) => void;
  getEnvironment: (id: string) => Environment | undefined;
  getVariables: (id: string) => Variable[] | undefined;
  getSecrets: (id: string) => Variable[] | undefined;
  getVariableByName: (id: string, name: string) => Variable | undefined;
  getSecretByName: (id: string, name: string) => Variable | undefined;
}

export const useEnvironmentStore = create<EnvironmentStore>()(
  persist(
    (set, get) => ({
      environments: [],
      selectedEnvironmentId: null,
      setEnvironments: (environments: Environment[]) => set({ environments }),
      setSelectedEnvironmentId: (id: string | null) =>
        set({ selectedEnvironmentId: id }),
      addEnvironment: (environment: Environment) =>
        set((state) => ({
          environments: [...state.environments, environment],
        })),
      deleteEnvironment: (id: string) =>
        set((state) => ({
          environments: state.environments.filter((e) => e.id !== id),
        })),
      updateEnvironment: (environment: Environment) =>
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === environment.id ? environment : e,
          ),
        })),
      setVariables: (id: string, variables: Variable[]) =>
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === id ? { ...e, variables } : e,
          ),
        })),
      setSecrets: (id: string, secrets: Variable[]) =>
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === id ? { ...e, secrets } : e,
          ),
        })),
      getSelectedEnvironment: () =>
        get().environments.find((e) => e.id === get().selectedEnvironmentId),
      getEnvironment: (id: string) =>
        get().environments.find((e) => e.id === id),
      getVariables: (id: string) =>
        get().environments.find((e) => e.id === id)?.variables,
      getSecrets: (id: string) =>
        get().environments.find((e) => e.id === id)?.secrets,
      getVariableByName: (id: string, name: string) =>
        get()
          .environments.find((e) => e.id === id)
          ?.variables.find((v) => v.key === name),
      getSecretByName: (id: string, name: string) =>
        get()
          .environments.find((e) => e.id === id)
          ?.secrets.find((s) => s.key === name),
    }),
    {
      name: 'yasumu-environment-store',
    },
  ),
);

export const interpolateEnvironmentVariables = <
  T extends string | File | null | undefined,
>(
  environment: Environment | undefined,
  str: T,
): T => {
  if (typeof str !== 'string') return str;
  if (!environment) return str;
  const { variables, secrets } = environment;

  return str.replace(/{{(.*?)}}/g, (match, p1) => {
    const variable = variables.find((v) => v.key === p1);
    if (variable) return variable.value;

    const secret = secrets.find((s) => s.key === p1);
    if (secret) return secret.value;

    return match;
  }) as T;
};
