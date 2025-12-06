# `@yasumu/den`

Internal NestJS-inspired dependency injection container and module system for Yasumu.

## Features

- **Modular Architecture**: Encapsulate code in Modules with `imports`, `exports`, `providers`, and `resolvers`.
- **Dependency Injection**: Powerful DI container with support for:
  - Class Providers
  - Value Providers
  - Factory Providers
  - Constructor Injection
- **Hierarchical Injectors**: Module-scoped containers with support for global modules.
- **RPC layer**: Built-in support for query/mutation resolvers.
- **Event Bus**: Simple reactive event bus system without external dependencies.

## Usage

### Entrypoint

```ts
import { DenFactory } from '@yasumu/den';
import { AppModule } from './app.module.js';

const app = await DenFactory.create(AppModule);

const result = await app.execute({
  action: 'users.list',
  type: 'query'
});
console.log(result);

await app.close();
```

### Modules

Modules are the building blocks of the application. They group related components.

```ts
import { Module } from '@yasumu/den';
import { UsersService } from './users.service.js';
import { UsersResolver } from './users.resolver.js';

@Module({
  imports: [], // Import other modules
  providers: [UsersService], // Register services
  resolvers: [UsersResolver], // Register RPC resolvers
  exports: [UsersService], // Export providers for other modules
})
export class UsersModule {}
```

### Services & Injection

Mark classes as `@Injectable()` to let the container manage them.

```ts
import { Injectable, Inject, Optional } from '@yasumu/den';

@Injectable()
export class ConfigService {
  constructor(@Optional() private readonly options?: any) {}
}

@Injectable()
export class UsersService {
  constructor(
    private readonly config: ConfigService,
    @Inject('DB_CONNECTION') private readonly db: any
  ) {}
}
```

### Event Bus

The `EventBus` allows for decoupled communication between services.

```ts
import { Injectable, EventBus } from '@yasumu/den';

class UserCreatedEvent {
  constructor(public readonly userId: string) {}
}

@Injectable()
export class UsersService {
  constructor(private readonly eventBus: EventBus) {}

  async create(data: any) {
    // ... create user logic
    await this.eventBus.publish(new UserCreatedEvent('123'));
  }
}

@Injectable()
export class NotificationService {
  constructor(private readonly eventBus: EventBus) {
    this.eventBus
      .ofType(UserCreatedEvent)
      .filter(event => event.userId !== 'admin')
      .subscribe(async (event) => {
        console.log(`User created: ${event.userId}`);
      });
  }
}
```

### Resolvers

Resolvers handle RPC requests.

```ts
import { Resolver, Query, Mutation } from '@yasumu/den';

@Resolver('users')
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query()
  async list() {
    return this.usersService.findAll();
  }

  @Mutation()
  async create(data: any) {
    return this.usersService.create(data);
  }
}
```

### Global Modules

Use `@Global()` to make a module's exports available everywhere without importing.

```ts
import { Global, Module } from '@yasumu/den';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

### Custom Providers

You can define providers using objects to handle complex injection scenarios.

```ts
@Module({
  providers: [
    // Value Provider
    {
      provide: 'API_KEY',
      useValue: 'secret-key',
    },
    // Factory Provider
    {
      provide: 'CONNECTION',
      useFactory: (config: ConfigService) => config.createConnection(),
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}
```
