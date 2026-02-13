# Repository Guidelines

## Project Structure & Module Organization
This repository is an Express-based backend deployed through Vercel serverless functions.
- `api/index.js`: main app composition (route mounting + middleware).
- `api/[...all].js`: Vercel catch-all entry.
- `routes/`: endpoint definitions by domain (`authRoutes.js`, `wisataRoutes.js`, etc.).
- `controllers/`: request handlers and business logic.
- `SistemRekomendasiControllers/` and `SistemRekomendasiRoutes/`: recommendation engine modules.
- `middleware/`: shared middleware (e.g., JWT auth).
- `migrations/`: SQL migration scripts (for example `migrations/add_indexes.sql`).
- `uploads/`: runtime/uploaded files; do not treat as source code.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npx vercel dev`: run local serverless runtime (preferred local run mode for this repo).
- `npm test`: currently placeholder and exits with error (`"no test specified"`), update when adding tests.
- `mysql -u <user> -p <db> < migrations/add_indexes.sql`: apply index migration manually.

## Coding Style & Naming Conventions
- Use CommonJS modules (`require`, `module.exports`) and `async/await` for async flows.
- Use 2-space indentation and semicolons, consistent with current files.
- File naming pattern: lower camel/purpose style in singular modules (for example `authController.js`, `authenticateToken.js`).
- Keep route files thin; place DB access and external service calls in controllers.
- Use clear JSON response messages and consistent HTTP status codes.

## Testing Guidelines
Automated tests are not set up yet. For now:
- Validate endpoints manually via Postman/Insomnia while running `npx vercel dev`.
- For every controller change, test success, validation failure, unauthorized, and server error paths.
- When adding tests, place them under `tests/` with names like `auth.controller.test.js` and wire `npm test` to run them.

## Commit & Pull Request Guidelines
Recent history uses short, informal messages (`fix controller`, `perbaikan db.js`). For better maintainability, use:
- Commit format: `type(scope): concise summary` (example: `fix(auth): validate missing token in /me`).
- Keep commits focused to one concern.
- PRs should include: purpose, changed endpoints/files, manual test evidence (request/response samples), and migration/config notes.

## Security & Configuration Tips
- Move secrets to environment variables (`JWT_SECRET`, `DB_*`, Supabase keys); never hardcode credentials.
- Sanitize and validate incoming payloads before DB writes.
- Exclude generated upload artifacts from review unless explicitly relevant.
