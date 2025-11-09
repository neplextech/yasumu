import type { prisma as PrismaClientSource } from './index.ts';
import { Migrations, PrismaClient } from 'prisma-migrations';
import { join } from 'node:path';

export async function migrateDatabase(prisma: typeof PrismaClientSource) {
  const migrationsDir = join(
    Yasumu.getResourcesDir(),
    'yasumu-scripts',
    'yasumu-server',
    'prisma',
    'migrations',
  );
  // const migrationsDir = join(Deno.cwd(), 'prisma', 'migrations');

  const migrations = new Migrations(prisma as unknown as PrismaClient, {
    migrationsDir,
  });

  try {
    // check pending migrations
    const pending = await migrations.pending();
    console.log(`Found ${pending.length} pending migrations`);

    if (pending.length < 1) return true;

    // run migrations
    const applied = await migrations.up();
    console.log(`Applied ${applied} migrations`);

    // verify latest migration
    const latest = await migrations.latest();
    if (latest) {
      console.log(`Latest migration: ${latest.name}`);
    } else {
      console.error('No latest migration found');
    }

    return true;
  } catch (error) {
    console.error('Failed to migrate database', error);
    return false;
  }
}
