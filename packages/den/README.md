# `@yasumu/den`

Internal nest-inspired dependency injection container for Yasumu.

## Usage

### Entrypoint

```ts
import { DenFactory } from '@yasumu/den';
import { WorkspaceModule } from './workspace.module.ts';

const app = await DenFactory.create(WorkspaceModule);

const result = await app.execute({
  action: 'workspaces.get',
  type: 'query'
});
console.log(result);
```

### Module

```ts
import { Module } from '@yasumu/den';

@Module({
  providers: [WorkspaceService],
  resolvers: [WorkspaceResolver],
})
export class WorkspaceModule {}
```

### Resolver

```ts
import { Resolver, Query, Mutation } from '@yasumu/den';

@Resolver('workspaces')
export class WorkspaceResolver {
  public constructor(private readonly workspaceService: WorkspaceService) {}

  @Query()
  public async list(): Promise<Workspace[]> {
    return this.workspaceService.list();
  }

  @Mutation()
  public async create(data: WorkspaceCreateOptions): Promise<Workspace> {
    return this.workspaceService.create(data);
  }
}
```

### Service

```ts
import { Injectable } from '@yasumu/den';

@Injectable()
export class WorkspaceService {
  public constructor(private readonly workspaceRepository: WorkspaceRepository) {}

  public async list(): Promise<Workspace[]> {
    return this.workspaceRepository.list();
  }

  public async create(data: WorkspaceCreateOptions): Promise<Workspace> {
    return this.workspaceRepository.create(data);
  }
}
```