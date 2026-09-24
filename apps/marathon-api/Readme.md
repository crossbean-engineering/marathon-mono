
provider endpoint for
---> partipabnd id , shirt number and shirt size ,
----> package received check checlist --> 



implement this api for me here are some important part

Users
* Full Name - String
* Phone Number - String
* Email Address - String?
* Ghana Card Number - String?
* Location  - String?
  Role - Enum (User , Agent, Admin)
  Status - active,suspended,

Packages;
*Package name - String
*Price: Gh 150 - number
*Items - Merchandise[](many to many with Merchandise)
*Benefits - String
*Prizes - Prize[](one to one wit prize)

Merchandise:
Name - String
Description - String

Prize:
Name - String
Amount -  Number?
position - Number?
description - String?

Participant
ic
name
user_id - User
package_id  - Package
code - String
Shirt Size - String?
Gender    - Enum(Male | Female)?
Status -  active,suspended,
payment_id - Payment table

Wristband
id - String         
code - String          
status - available,redeemed,disabled
isPrinted
participant_id Participant?

Endpoints
Signup
login
CRUD Packages(includ CUR of prizes & ADD Items)
CRUD Merchandise
BUY Package(login user , role : User )
DELETE Prize
CRUD wrisbrand
Redeem wrisband --> Review gis-bazzar-api for logics
list transactions
basic reports
basic stats
boostrap admin endpoints
add admin users


-----
Buy package flow also create a participant
this payload need to accept both data
participant name is unique
buy package will integrate with mojo collection for payment
for how we handle payment and payment tables check the other app gift registry

we need role and permission using rabaccess

scope
this api will be use for a marathom app where user will sign up and create/add participants
each participants will have a one Packages they sign up for on windder will be define based on this package
each partipant will use the participant code to reedem a wristband ounce this is link can be resued

---

## Local Development Setup

> Note: this file is served from the same path as `README.md` (macOS' default
> filesystem is case-insensitive), so the setup docs below are appended to the
> original product-spec notes above rather than replacing them.

### Prerequisites

- Node 22.15.0, Yarn (Corepack)
- A local PostgreSQL instance
- A local Redis instance (`redis://localhost:6379`)

### First-time setup

1. Copy the env file and fill in secrets:
   ```bash
   cp apps/marathon-api/.env.example apps/marathon-api/.env
   ```
2. Point `MARATHON_DATABASE_URL` at a disposable local Postgres database, e.g.:
   ```
   MARATHON_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marathon
   ```
3. Install dependencies (also runs `prisma generate` via the repo's `postinstall`):
   ```bash
   yarn install
   ```
4. Generate the Prisma client (safe without a live DB — it only reads the schema):
   ```bash
   npx nx generate-prisma marathon-api
   ```
5. Run migrations against your local database (needs a live DB; also enables the
   `uuid-ossp` extension used by `uuid_generate_v1()` — see
   `prisma/migrations/README.md`):
   ```bash
   npx nx prisma-migrate-dev marathon-api
   ```
6. Serve the API:
   ```bash
   npx nx serve marathon-api
   ```

### Prisma Nx targets

- `nx generate-prisma marathon-api` — regenerate the Prisma client (`src/generated/prisma`)
- `nx prisma-migrate-dev marathon-api` — create/apply a dev migration
- `nx prisma-studio marathon-api` — open Prisma Studio against `prisma.config.ts`

### Integration/e2e specs

`marathon-spec` drives the SDK against a running server + test DB + Redis, and
auto-skips when `MARATHON_BASE_URL` is unset (see `health.spec.ts`). Set
`MARATHON_BASE_URL=http://localhost:3000` (or wherever `nx serve
marathon-api` is listening) before running those specs. OTP codes are read
back from Redis via the `otp:dev:<sessionId>` dev key in non-production
environments.
