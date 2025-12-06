export const MODULE_METADATA = {
  IMPORTS: 'den:imports',
  PROVIDERS: 'den:providers',
  CONTROLLERS: 'den:controllers', // For future use or if we merge concepts
  RESOLVERS: 'den:resolvers',
  EXPORTS: 'den:exports',
  GLOBAL: 'den:global',
};

export const RESOLVER_METADATA = {
  NAMESPACE: 'den:resolver_namespace',
  HANDLERS: 'den:resolver_handlers',
  PARAMS: 'den:resolver_params',
};

export const INJECTABLE_METADATA = 'den:injectable';
export const INJECT_METADATA = 'den:inject';
export const OPTIONAL_METADATA = 'den:optional';
export const DESIGN_PARAMTYPES = 'design:paramtypes';
