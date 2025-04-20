// import { readFile, writeFile } from 'node:fs/promises';

// const dialects = ['sqlite', 'postgresql'];
// const common = await readFile('./prisma/schema.prisma');

// const datasource = (dialect: string) => `datasource db {
//   provider = "${dialect}"
//   url      = env("DATABASE_URL")
// }`;

// const generateSchema = (dialect: string) => {
//   return `// This file is auto-generated, do not modify it\n${datasource(dialect)}\n\n${common}`;
// };

// const writeSchema = async (dialect: string) => {
//   const schema = generateSchema(dialect);
//   await writeFile(`./prisma/${dialect}.schema.prisma`, schema);
// };

// for (const dialect of dialects) {
//   await writeSchema(dialect);
// }

// console.log('SQLite and Postgres schemas generated successfully.');
