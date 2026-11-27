# @worko/database

## 0.2.0

### Minor Changes

- 1c7eb4e: Exclude environment files from the published package.

## 0.1.0

### Minor Changes

- Initial public release of `@worko/database` SDK.
- Pure database SDK: exports `createDatabaseClient(databaseUrl)` factory and all Prisma-generated types.
- No environment variable reads at runtime — callers supply the connection URL explicitly.
- Full Prisma schema with 56 tables, relations, migrations, and seed scripts.
