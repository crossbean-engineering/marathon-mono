import { PrismaClient } from '@marathon-api/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { MarathonApiMeta } from './config';

const adapter = new PrismaPg({
  connectionString: MarathonApiMeta.databaseUrl,
  max: 25,
});

const db = new PrismaClient({ adapter });

export default db;
export { db };

export async function checkDatabaseConnection(retries = 5, delay = 5000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await db.$connect();
      console.log('[marathon-api] database connected');
      return;
    } catch (error) {
      console.error(`[marathon-api] db connect attempt ${attempt}/${retries} failed`, error);
      if (attempt === retries) process.exit(1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
