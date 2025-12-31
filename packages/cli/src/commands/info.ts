import { Command } from 'commander';
import pc from 'picocolors';
import { WorkspaceLoader, resolveWorkspacePath } from '../workspace/loader.js';

export const infoCommand = new Command('info')
  .description('Display information about the Yasumu workspace')
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

    const workspace = loader.loadWorkspace();
    if (!workspace) {
      console.error(pc.red('Failed to load workspace'));
      process.exit(1);
    }

    const restEntities = loader.loadRestEntities();
    const environments = loader.loadEnvironments();
    const groups = Object.values(workspace.groups);

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            workspace: {
              id: workspace.metadata.id,
              name: workspace.metadata.name,
              version: workspace.metadata.version,
              path: workspace.path,
              snapshot: workspace.snapshot,
            },
            stats: {
              restEntities: restEntities.length,
              environments: environments.length,
              groups: groups.length,
            },
            restEntities: restEntities.map((e) => ({
              id: e.id,
              name: e.name,
              method: e.method,
              url: e.url,
              hasScript: !!e.script,
              hasTest: !!e.test,
            })),
            environments: environments.map((e) => ({
              id: e.id,
              name: e.name,
              variableCount: e.variables.length,
              secretCount: e.secrets.length,
            })),
          },
          null,
          2,
        ),
      );
      return;
    }

    console.log();
    console.log(pc.bold(pc.cyan('┌─ Yasumu Workspace')));
    console.log(pc.cyan('│'));
    console.log(
      pc.cyan('├─') + pc.bold(' Name:    ') + workspace.metadata.name,
    );
    console.log(
      pc.cyan('├─') + pc.bold(' ID:      ') + pc.dim(workspace.metadata.id),
    );
    console.log(
      pc.cyan('├─') + pc.bold(' Version: ') + workspace.metadata.version,
    );
    console.log(pc.cyan('├─') + pc.bold(' Path:    ') + pc.dim(workspace.path));
    console.log(
      pc.cyan('├─') +
        pc.bold(' Snapshot: ') +
        pc.dim(new Date(workspace.snapshot).toISOString()),
    );
    console.log(pc.cyan('│'));

    console.log(pc.cyan('├─') + pc.bold(pc.yellow(' Statistics')));
    console.log(
      pc.cyan('│  ├─') + ` REST Entities: ${pc.green(restEntities.length)}`,
    );
    console.log(
      pc.cyan('│  ├─') + ` Environments:  ${pc.green(environments.length)}`,
    );
    console.log(
      pc.cyan('│  └─') + ` Groups:        ${pc.green(groups.length)}`,
    );

    if (restEntities.length > 0) {
      console.log(pc.cyan('│'));
      console.log(pc.cyan('├─') + pc.bold(pc.magenta(' REST Entities')));
      restEntities.forEach((entity, index) => {
        const isLast = index === restEntities.length - 1;
        const prefix = isLast ? '└─' : '├─';
        const methodColor = getMethodColor(entity.method);
        const flags = [];
        if (entity.script) flags.push(pc.cyan('script'));
        if (entity.test) flags.push(pc.magenta('test'));
        const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
        console.log(
          pc.cyan(`│  ${prefix}`) +
            ` ${methodColor(entity.method.padEnd(6))} ${pc.bold(entity.name)}${flagStr}`,
        );
        console.log(
          pc.cyan(`│  ${isLast ? ' ' : '│'}  `) +
            pc.dim(`${entity.url ?? '(no url)'}`),
        );
      });
    }

    if (environments.length > 0) {
      console.log(pc.cyan('│'));
      console.log(pc.cyan('├─') + pc.bold(pc.blue(' Environments')));
      environments.forEach((env, index) => {
        const isLast = index === environments.length - 1;
        const prefix = isLast ? '└─' : '├─';
        console.log(
          pc.cyan(`│  ${prefix}`) +
            ` ${pc.bold(env.name)} ${pc.dim(`(${env.variables.length} vars, ${env.secrets.length} secrets)`)}`,
        );
      });
    }

    console.log(pc.cyan('│'));
    console.log(pc.cyan('└─────────────────────────'));
    console.log();
  });

function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case 'GET':
      return pc.green;
    case 'POST':
      return pc.yellow;
    case 'PUT':
      return pc.blue;
    case 'PATCH':
      return pc.cyan;
    case 'DELETE':
      return pc.red;
    default:
      return pc.white;
  }
}
