import type { Config } from 'drizzle-kit';

export default {
  schema: './src/storage/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
