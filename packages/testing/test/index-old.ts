import { YasumuGraphqlEntity } from '@yasumu/core';
import { yasumu } from '@yasumu/testing';

const dir = import.meta.dirname + '/sample-workspace';

const workspace = await yasumu.openWorkspace({
  path: dir,
});

const target = Object.keys(
  workspace.getMetadata().getRawData().blocks.GraphQL.entities,
)[0];

let graphql: YasumuGraphqlEntity;
if (!target)
  graphql = await workspace.graphql.create({
    name: 'GraphQL Demo',
    url: 'https://readonlydemo.vendure.io/shop-api',
  });
else graphql = await workspace.graphql.open(target);

graphql.setVariable('term', 'shoe');
graphql.setVariable('take', 1);

graphql.setQuery(`query GetProductList($take: Int, $term: String) {
  products(
    options: {
      take: $take
      filter: { name: { contains: $term } }
      sort: { name: ASC }
    }
  ) {
    totalItems
    items {
      id
      name
      slug
      featuredAsset {
        preview
        mimeType
        width
        height
      }
    }
  }
}`);

const res = await graphql.send();

console.log(await res?.json());

// let entity: YasumuRestEntity;

// if (!target)
//   entity = await workspace.rest.create({
//     name: 'Get todo by id',
//     url: 'https://jsonplaceholder.typicode.com/todos/1',
//   });
// else entity = await workspace.rest.open(target);

// const request = entity.createInteractiveWebRequest();

// setTimeout(() => request.cancel(), 500);

// await entity.execute({ request });

// console.log(entity.toJSON());

// await entity.delete();

// console.log(entity.toJSON());

// await entity.setPath('/updated-path');
// await entity.rename('New Name');

// console.log(entity.toJSON());
