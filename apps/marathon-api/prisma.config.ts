import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma',
  datasource: {
    url:
      process.env['MARATHON_DATABASE_URL'] ||
      'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  },
  migrations: { path: 'prisma/migrations' },
});
