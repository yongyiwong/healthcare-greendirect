import * as path from 'path';
import * as fs from 'fs';

/**
 * Load the sql text file with the given name (corresponds to migration name.)
 * Run this file as a transpiled .js file
 * @param sqlFileName the generated name of the migration
 * @param mode up or down (appends to filename)
 */
export const getSql = (sqlFileName: string, mode: 'up' | 'down') => {
  const filePath = path.join(
    process.cwd(),
    '/dist/db/migrations/sqls',
    `${sqlFileName}.${mode}.sql`,
  );
  const sql = fs.readFileSync(filePath, { encoding: 'utf-8' });
  return sql;
};
