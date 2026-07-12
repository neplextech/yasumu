export function serializeWorkspaceContent(workspace: { name: string; version: number }): string {
  return JSON.stringify({
    name: workspace.name,
    version: workspace.version,
  });
}

export function serializeRestContent(entity: {
  id: string;
  name: string;
  method: string;
  url: string | null;
  groupId: string | null;
  requestHeaders: { key: string; value: string; enabled: boolean }[] | null;
  requestParameters: { key: string; value: string; enabled: boolean }[] | null;
  searchParameters: { key: string; value: string; enabled: boolean }[] | null;
  requestBody: { type: string; value: unknown } | null;
  script: { code: string } | null;
}): string {
  return JSON.stringify({
    id: entity.id,
    name: entity.name,
    method: entity.method,
    url: entity.url,
    groupId: entity.groupId,
    headers: entity.requestHeaders ?? [],
    parameters: entity.requestParameters ?? [],
    searchParameters: entity.searchParameters ?? [],
    body: entity.requestBody,
    script: entity.script,
  });
}

export function serializeGraphqlContent(entity: {
  id: string;
  name: string;
  url: string | null;
  groupId: string | null;
  requestHeaders: { key: string; value: string; enabled: boolean }[] | null;
  requestParameters: { key: string; value: string; enabled: boolean }[] | null;
  searchParameters: { key: string; value: string; enabled: boolean }[] | null;
  requestBody: { type: string; value: unknown } | null;
  script: { code: string } | null;
}): string {
  return JSON.stringify({
    id: entity.id,
    name: entity.name,
    url: entity.url,
    groupId: entity.groupId,
    headers: entity.requestHeaders ?? [],
    parameters: entity.requestParameters ?? [],
    searchParameters: entity.searchParameters ?? [],
    body: entity.requestBody,
    script: entity.script,
  });
}

export function serializeEnvironmentContent(env: {
  id: string;
  name: string;
  variables: { key: string; value: string; enabled: boolean }[];
}): string {
  return JSON.stringify({
    id: env.id,
    name: env.name,
    variables: env.variables,
  });
}

export function serializeSmtpContent(smtpConfig: { id: string; port: number; username: string | null }): string {
  return JSON.stringify({
    id: smtpConfig.id,
    port: smtpConfig.port,
    username: smtpConfig.username,
  });
}
