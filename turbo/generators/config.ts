import type { PlopTypes } from '@turbo/gen';

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  const destination = plop.getDestBasePath();

  plop.setGenerator('bootstrap', {
    description: 'Bootstrap a new Yasumu project',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the package to generate?',
      },
      {
        type: 'input',
        name: 'description',
        message: 'What is the description of the package to generate?',
      },
    ],
    actions: [
      {
        type: 'addMany',
        templateFiles: ['templates/**/*'],
        base: 'templates',
        stripExtensions: ['hbs'],
        destination: `${destination}/packages/{{name}}`,
      },
    ],
  });
}
