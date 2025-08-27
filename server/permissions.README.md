## Permissions configuration

This project uses a simple, explicit permission model stored in the `permissions` table (see `shared/schema.ts`). Each permission row binds a `userId` to a `module` and four capability flags: `canView`, `canCreate`, `canUpdate`, `canDelete`.

### Modules

Common module names include: `menu`, `orders`, `reservations`, `tables`, `analytics`, `users`, `inventory`, `settings`. You can extend this list as needed. Ensure your routes use consistent module names when checking authorization.

### Recommended roles to permissions mapping

- admin: full access on all modules
- manager: view/create/update on business modules (orders, reservations, menu, tables, analytics), limited delete
- staff: view and limited create/update where operationally needed (orders/reservations)
- user: no back-office permissions (handled by app-level checks)

### API endpoints (server/routes/permissions*.ts)

- GET `/api/permissions/:userId` – list a user's permissions
- POST `/api/permissions` – set/replace permissions for a user (validated with Zod)
- PATCH `/api/permissions/:id` – update a single permission row
- DELETE `/api/permissions/:id` – remove a permission row
- GET `/api/permissions/templates` – recommended templates by role

Each endpoint requires authentication and, for modifying operations, usually `requireRoles(['admin'])`.

### Middleware helpers

Use `requireRoles(['admin'])` for role-gated endpoints. For fine-grained checks, implement a per-module checker that queries `permissions` by `userId` and `module` and asserts specific capability flags.

### Validation

Use Zod schemas to validate incoming payloads consistently:

- module: non-empty string, known modules preferred
- canView/canCreate/canUpdate/canDelete: booleans
- userId: positive integer

### Seeding (optional)

Seed admin user with full permissions and managers/staff with scoped permissions as part of your onboarding or migrations.

