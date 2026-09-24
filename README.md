# marathon-mono

Nx monorepo for the Akuapem Ridge Marathon platform.

| Project           | Path                    | Description                                    |
| ----------------- | ----------------------- | ---------------------------------------------- |
| `marathon-api`    | `apps/marathon-api`     | Express/Prisma API (`@marathon-api/*`)         |
| `marathon`        | `apps/marathon`         | React + Vite frontend                          |
| `marathon-core`   | `libs/marathon-core`    | Shared API spec & domain types (`@marathon/core`) |
| `marathon-spec`   | `libs/marathon-spec`    | API integration specs                          |
| `api-framework`   | `libs/api-framework`    | Shared backend integrations (`@api/framework`) |
| `ak-marathon-sdk` | `libs/ak-marathon-sdk`  | React SDK used by the frontend                 |
| `config`          | `libs/config`           | API URIs per stage (`@org/config`)             |

## Getting started

```sh
yarn install
cp apps/marathon-api/.env.example apps/marathon-api/.env
yarn generate:prisma
yarn dev:api   # nx serve marathon-api
yarn dev:web   # nx dev marathon  -> http://localhost:4200
```
