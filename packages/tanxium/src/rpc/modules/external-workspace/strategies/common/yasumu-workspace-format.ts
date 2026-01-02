import {
  HttpMethod,
  RestEntityRequestBody,
  TabularPair,
  YasumuEmbeddedScript,
} from '@yasumu/common';

export interface YasumuWorkspaceFormatEnvironment {
  id: string;
  name: string;
  variables: TabularPair[];
  secrets: TabularPair[];
}

export interface YasumuWorkspaceFormatRest {
  id: string;
  name: string;
  url: string;
  groupId: string | null;
  method: HttpMethod;
  headers: TabularPair[];
  body: RestEntityRequestBody | null;
  parameters: TabularPair[];
  searchParameters: TabularPair[];
  script: YasumuEmbeddedScript | null;
  testScript: YasumuEmbeddedScript | null;
  dependencies: string[];
}

export interface YasumuWorkspaceFormatEntityGroup {
  id: string;
  name: string;
  parentId: string | null;
  children: YasumuWorkspaceFormatEntityGroup[];
}

export interface YasumuWorkspaceFormat {
  environments: YasumuWorkspaceFormatEnvironment[];
  rest: YasumuWorkspaceFormatRest[];
  entityGroups: YasumuWorkspaceFormatEntityGroup[];
}
