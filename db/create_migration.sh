#!/bin/bash
MIGRATION_PATH=./db/migrations/
MIGRATION_SUCCESS=$(npx typeorm migration:create -n $1)
MIGRATION_FILENAME=$(sed -e 's|.*migrations\/\(.*\).ts.*|\1|' <<< $MIGRATION_SUCCESS)

# create up.sql and down.sql scripts
touch $MIGRATION_PATH/sqls/$MIGRATION_FILENAME{.up,.down}.sql

MIGRATION_FILE=$MIGRATION_PATH/$MIGRATION_FILENAME.ts

# write imports of sql scripts
sed -i '' "2i\\
import { getSql } from './utils/migration.util';
" $MIGRATION_FILE

sed -i '' "/public async up/ a\\
return queryRunner.query(getSql('$MIGRATION_FILENAME', 'up'));
" $MIGRATION_FILE

sed -i '' "/public async down/ a\\
return queryRunner.query(getSql('$MIGRATION_FILENAME', 'down'));
" $MIGRATION_FILE

# pretty please
npx prettier --write $MIGRATION_FILE

echo $MIGRATION_SUCCESS
