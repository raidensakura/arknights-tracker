#!/bin/sh
set -e

SCHEMA_PATH="prisma/postgres/schema.prisma"
if [ "$DB_PROVIDER" = "sqlite" ]; then
  SCHEMA_PATH="prisma/sqlite/schema.prisma"
fi

npx prisma generate --schema "$SCHEMA_PATH"
npx prisma migrate deploy --schema "$SCHEMA_PATH"

exec node server.js
