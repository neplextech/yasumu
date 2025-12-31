import { Command } from 'commander';
import pc from 'picocolors';
import { WorkspaceLoader, resolveWorkspacePath } from '../workspace/loader.js';
import { RestExecutor, formatResult } from '../executor/rest-executor.js';

export const restCommand = new Command('rest').description(
  'REST API operations',
);

restCommand
  .command('run [target]')
  .description('Execute REST entities')
  .option('-p, --path <path>', 'Path to the workspace directory')
  .option('-a, --all', 'Run all REST entities')
  .option('--no-script', 'Skip pre/post request scripts')
  .option('-e, --env <environment>', 'Environment name or ID to use')
  .option('-v, --verbose', 'Show detailed response information')
  .option('--json', 'Output results as JSON')
  .action(
    async (
      target: string | undefined,
      options: {
        path?: string;
        all?: boolean;
        script?: boolean;
        env?: string;
        verbose?: boolean;
        json?: boolean;
      },
    ) => {
      const workspacePath = resolveWorkspacePath(options.path);
      const loader = new WorkspaceLoader(workspacePath);

      if (!loader.exists()) {
        console.error(
          pc.red(`No Yasumu workspace found at: ${workspacePath}/yasumu`),
        );
        process.exit(1);
      }

      const entities = loader.loadRestEntities();

      if (entities.length === 0) {
        console.error(pc.yellow('No REST entities found in workspace'));
        process.exit(0);
      }

      let entitiesToRun = entities;

      if (!options.all && target) {
        const entity = loader.findRestEntity(target);
        if (!entity) {
          console.error(pc.red(`REST entity not found: ${target}`));
          console.log(pc.dim('\nAvailable entities:'));
          for (const e of entities) {
            console.log(pc.dim(`  - ${e.name} (${e.id})`));
          }
          process.exit(1);
        }
        entitiesToRun = [entity];
      } else if (!options.all && !target) {
        console.error(
          pc.red('Please specify an entity name/id or use --all to run all'),
        );
        process.exit(1);
      }

      let environment = undefined;
      if (options.env) {
        environment = loader.findEnvironment(options.env);
        if (!environment) {
          const availableEnvs = loader.loadEnvironments();
          console.error(pc.red(`Environment not found: ${options.env}`));
          if (availableEnvs.length > 0) {
            console.log(pc.dim('\nAvailable environments:'));
            for (const e of availableEnvs) {
              console.log(pc.dim(`  - ${e.name} (${e.id})`));
            }
          }
          process.exit(1);
        }
      }

      const executor = new RestExecutor(environment);

      if (!options.json) {
        console.log();
        console.log(
          pc.bold(
            pc.cyan(
              `Running ${entitiesToRun.length} REST entit${entitiesToRun.length === 1 ? 'y' : 'ies'}...`,
            ),
          ),
        );
        if (environment) {
          console.log(pc.dim(`Using environment: ${environment.name}`));
        }
        if (options.script === false) {
          console.log(pc.dim('Scripts: disabled'));
        }
        console.log();
      }

      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const entity of entitiesToRun) {
        const result = await executor.execute(entity, {
          noScript: options.script === false,
          environment,
          verbose: options.verbose,
        });

        results.push(result);

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        if (!options.json) {
          formatResult(result, options.verbose ?? false);
        }
      }

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              summary: {
                total: entitiesToRun.length,
                success: successCount,
                failed: failCount,
              },
              results: results.map((r) => ({
                id: r.entity.id,
                name: r.entity.name,
                method: r.entity.method,
                url: r.entity.url,
                success: r.success,
                status: r.status,
                statusText: r.statusText,
                duration: r.duration,
                error: r.error,
                headers: r.headers,
                body: r.body,
              })),
            },
            null,
            2,
          ),
        );
      } else {
        console.log();
        console.log(
          pc.bold('Summary: ') +
            pc.green(`${successCount} passed`) +
            (failCount > 0 ? pc.red(`, ${failCount} failed`) : ''),
        );
        console.log();
      }

      if (failCount > 0) {
        process.exit(1);
      }
    },
  );

restCommand
  .command('list')
  .description('List all REST entities in the workspace')
  .option('-p, --path <path>', 'Path to the workspace directory')
  .option('--json', 'Output as JSON')
  .action((options: { path?: string; json?: boolean }) => {
    const workspacePath = resolveWorkspacePath(options.path);
    const loader = new WorkspaceLoader(workspacePath);

    if (!loader.exists()) {
      console.error(
        pc.red(`No Yasumu workspace found at: ${workspacePath}/yasumu`),
      );
      process.exit(1);
    }

    const entities = loader.loadRestEntities();

    if (options.json) {
      console.log(
        JSON.stringify(
          entities.map((e) => ({
            id: e.id,
            name: e.name,
            method: e.method,
            url: e.url,
            hasScript: !!e.script,
            hasTest: !!e.test,
            groupId: e.groupId,
          })),
          null,
          2,
        ),
      );
      return;
    }

    if (entities.length === 0) {
      console.log(pc.yellow('No REST entities found'));
      return;
    }

    console.log();
    console.log(pc.bold(`REST Entities (${entities.length}):`));
    console.log();

    for (const entity of entities) {
      const methodColor = getMethodColor(entity.method);
      const flags = [];
      if (entity.script) flags.push(pc.cyan('<script/>'));
      if (entity.test) flags.push(pc.magenta('<test/>'));
      const flagStr = flags.length > 0 ? ` (${flags.join(', ')})` : '';

      console.log(
        `  ${methodColor(entity.method.padEnd(6))} ${pc.bold(entity.name)}${flagStr}`,
      );
      console.log(pc.dim(`         ${entity.url ?? '(no url)'}`));
      console.log(pc.dim(`         ID: ${entity.id}`));
      console.log();
    }
  });

function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case 'GET':
      return pc.green;
    case 'POST':
      return pc.blue;
    case 'PATCH':
      return pc.yellow;
    case 'PUT':
      return pc.magenta;
    case 'DELETE':
      return pc.red;
    case 'OPTIONS':
      return pc.magenta;
    case 'HEAD':
      return pc.gray;
    default:
      return pc.white;
  }
}
