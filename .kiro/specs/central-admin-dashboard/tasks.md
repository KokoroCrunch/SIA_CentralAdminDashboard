# Implementation Plan: Central Admin Dashboard

## Overview

The implementation proceeds in 14 phases, each building on the last. Phases 1–3 establish the monorepo scaffold and foundational packages. Phases 4–7 build the complete backend (data models → token service → auth middleware → auth controllers). Phases 8–11 build the complete frontend (foundation → routing → pages → UI shell wiring). Phases 12–14 add property-based tests, unit tests, and integration tests. No phase introduces code that depends on a later phase.

---

## Tasks

- [x] 1. Monorepo scaffolding

  - [x] 1.1 Create root `package.json` with npm workspaces, workspace scripts (`install:all`, `dev`, `test`), and declare `frontend/`, `mui-structure/`, `backend/` as workspace packages
    - Add `"workspaces": ["frontend", "mui-structure", "backend"]`
    - Add scripts: `install:all` → `npm install --workspaces`, `dev` → `concurrently` frontend+backend dev servers, `test` → `npm test --workspaces`
    - _Requirements: 9.5, 9.8_
  - [x] 1.2 Create `frontend/package.json` (`@project/frontend`), `mui-structure/package.json` (`@project/mui-structure`), and `backend/package.json` (`@project/backend`) with their respective dependencies (React 18 + Vite, MUI, Express, Mongoose, Jest, Vitest, fast-check, etc.)
    - `frontend/` depends on `"@project/mui-structure": "*"` (workspace link)
    - Include Prettier as a root devDependency with a shared `.prettierrc`
    - _Requirements: 9.2, 9.3, 9.4, 9.7_
  - [x] 1.3 Create root `.env.example` documenting all required environment variables (`PORT`, `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `NODE_ENV`, `CLIENT_ORIGIN`, `COOKIE_SECRET`)
    - _Requirements: 9.6_
  - [x] 1.4 Create root `.gitignore` (node_modules, .env, dist, coverage), root `.prettierrc` (single quotes, 2-space indent, trailing commas), and `vite.config.js` stubs for frontend
    - _Requirements: 9.1_

- [x] 2. MUI structure package

  - [x] 2.1 Create `mui-structure/src/tokens/designTokens.js` exporting `COLORS`, `SPACING`, and `TYPOGRAPHY` constants
    - _Requirements: 9.3_
  - [x] 2.2 Create `mui-structure/src/theme/theme.js` calling `createTheme()` with values derived from `designTokens.js`
    - _Requirements: 9.3_
  - [x] 2.3 Create `mui-structure/src/components/Topbar.jsx` — MUI `<AppBar>` accepting `{ user, onLogout, onMenuOpen }`, renders user name + role chip and logout `<IconButton>`
    - _Requirements: 6.6, 6.7, 6.8_
  - [x] 2.4 Create `mui-structure/src/components/Sidebar.jsx` — MUI `<Drawer variant="permanent">` on ≥768 px, `<Drawer variant="temporary">` on <768 px, accepts `{ navItems, activeRoute }`; renders filtered nav list with active-link highlight
    - _Requirements: 6.1, 6.2, 6.5, 6.9_
  - [x] 2.5 Create `mui-structure/src/components/UIShell.jsx` — root layout wrapper accepting `{ children }`, composes `<Sidebar>`, `<Topbar>`, and `<Box component="main">`
    - _Requirements: 6.1_
  - [x] 2.6 Create `mui-structure/src/index.js` barrel-exporting `UIShell`, `Sidebar`, `Topbar`, `theme`, and `designTokens`
    - _Requirements: 9.3_

- [x] 3. Backend foundation

  - [x] 3.1 Create `backend/src/config/env.js` — load `.env` with `dotenv`, validate with Joi, and export a typed config object (`port`, `mongoUri`, `jwtAccessSecret`, `jwtRefreshSecret`, `jwtAccessExpiry`, `jwtRefreshExpiry`, `nodeEnv`, `clientOrigin`)
    - _Requirements: 8.1_
  - [x] 3.2 Create `backend/src/db/connection.js` — Mongoose `connect()` with retry logic, exporting a `connectDB()` function
    - _Requirements: 8.1_
  - [x] 3.3 Create `backend/src/app.js` — Express factory applying middleware in order: `helmet`, `cors` (origin from config), `express.json`, `cookieParser`, `morgan`; mount `/api/v1` router; register 404 handler and `errorHandler`
    - All 404 and unhandled responses use `{ success, data, message }` envelope
    - _Requirements: 8.1, 8.2, 8.6_
  - [x] 3.4 Create `backend/src/server.js` — HTTP entry point: call `connectDB()` then `app.listen()`, log startup info
    - _Requirements: 8.1_
  - [x] 3.5 Create `backend/src/middleware/errorHandler.js` — global error handler mapping error types to HTTP status codes per the error-handling table; never exposes stack traces in response body; logs full error server-side
    - _Requirements: 8.3_

- [x] 4. Data models

  - [x] 4.1 Create `backend/src/models/User.js` — Mongoose schema with `name` (String, required, trim, 1–100), `email` (String, required, unique, lowercase, trim), `passwordHash` (String, required, `select: false`), `role` (enum: admin/staff/student); add case-insensitive unique index on `email`; add `timestamps: true`
    - _Requirements: 1.1, 1.6_
  - [x] 4.2 Create `backend/src/models/RevokedToken.js` — Mongoose schema with `token` (String, required, unique), `tokenType` (enum: access/refresh), `expiresAt` (Date, required); add MongoDB TTL index `{ expireAfterSeconds: 0 }` on `expiresAt`
    - _Requirements: 4.1, 4.2_

- [x] 5. Token service

  - [x] 5.1 Implement `backend/src/services/token.service.js` with `signAccessToken(userId, role)`, `signRefreshToken(userId)`, `verifyAccessToken(token)`, `verifyRefreshToken(token)`, `revokeAccessToken(token, expiresAt)`, `revokeRefreshToken(jti, expiresAt)`, and `isRevoked(tokenOrJti)`
    - Access token payload: `{ sub, role, type: 'access' }`, 15 min expiry
    - Refresh token payload: `{ sub, jti: uuid_v4, type: 'refresh' }`, 7 day expiry
    - `revokeAccessToken` / `revokeRefreshToken` write to `RevokedToken` collection
    - `isRevoked` queries `RevokedToken` by token string or jti
    - _Requirements: 2.4, 3.1, 4.1, 4.2_

- [x] 6. Auth middleware

  - [x] 6.1 Create `backend/src/middleware/authenticate.js` — extract Bearer token from `Authorization` header; call `verifyAccessToken`; check `isRevoked`; populate `req.user = { id, role }`; return `401` for missing/invalid/revoked tokens
    - _Requirements: 5.2, 4.1_
  - [x] 6.2 Create `backend/src/middleware/authorize.js` — `authorize(...allowedRoles)` factory; check `req.user.role` against `allowedRoles`; return `403` if not permitted; call `next()` if permitted
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 6.3 Create `backend/src/validators/auth.validators.js` — Joi schemas `registerSchema` and `loginSchema` with field-level constraints (name 1–100, valid email, password ≥ 8, role enum)
    - _Requirements: 1.3, 1.4, 1.5, 2.6, 2.7_
  - [x] 6.4 Create `backend/src/middleware/validate.js` — middleware factory `validate(schema)` that runs Joi validation and returns `400` with an errors array `[{ field, message }]` on failure
    - _Requirements: 8.5, 1.3, 1.4_

- [ ] 7. Auth controllers and routes

  - [x] 7.1 Implement `backend/src/controllers/auth.controller.js` with four controllers:
    - `registerUser` — hash password with bcrypt (≥10 rounds), create User, return 201 with `{ id, name, email, role }`
    - `loginUser` — find user by email, compare hash, sign tokens, set refresh cookie per cookie security config, return 200 with `{ accessToken }`
    - `refreshToken` — read cookie, verify refresh token, check revocation, rotate (revoke old, issue new), return 200 with `{ accessToken }`
    - `logoutUser` — revoke access token, revoke refresh token (if present), clear cookie, return 200
    - _Requirements: 1.1, 1.2, 1.6, 2.1, 2.5, 3.1, 3.2, 4.1, 4.2, 4.3_
  - [x] 7.2 Create `backend/src/routes/auth.routes.js` wiring middleware chains: `POST /register` → `validate(registerSchema), authenticate, authorize('admin'), registerUser`; `POST /login` → `validate(loginSchema), loginUser`; `POST /refresh` → `refreshToken`; `POST /logout` → `authenticate, logoutUser`
    - _Requirements: 1.1, 2.1, 3.1, 4.1_
  - [x] 7.3 Create `backend/src/routes/index.js` mounting `auth.routes.js` under `/api/v1/auth` and export the combined router; mount this router in `app.js`
    - _Requirements: 8.1_

- [ ] 8. Frontend foundation

  - [x] 8.1 Create `frontend/src/main.jsx` — React DOM root with `<ThemeProvider theme={theme}>` wrapping `<App />`; import theme from `@project/mui-structure`
    - _Requirements: 9.7_
  - [x] 8.2 Create `frontend/src/context/AuthContext.jsx` — `AuthProvider` holding `user`, `accessToken` in React state (never localStorage); implement `login(credentials)`, `logout()`, `refreshAccessToken()` methods calling the backend; export `useAuth` hook
    - _Requirements: 2.1, 2.5, 4.1, 7.5_
  - [x] 8.3 Create `frontend/src/api/axiosInstance.js` — Axios instance with base URL from env; request interceptor attaches `Authorization: Bearer <accessToken>`; response interceptor: on 401, call `refreshAccessToken()`, retry original request once using `_retry` flag; on refresh failure call `logout()` and navigate to `/login`
    - _Requirements: 3.1, 5.2_
  - [x] 8.4 Create `frontend/src/features/auth/authService.js` — functions `loginRequest(credentials)`, `logoutRequest()`, `refreshRequest()` using `axiosInstance`
    - _Requirements: 2.1, 4.1_

- [ ] 9. Frontend routing

  - [x] 9.1 Create `frontend/src/routes/ProtectedRoute.jsx` — reads `auth.user` from `useAuth()`; if null, redirects to `/login?redirect=<currentPath>`; otherwise renders `<Outlet />`
    - _Requirements: 7.5_
  - [x] 9.2 Create `frontend/src/routes/RoleRoute.jsx` — accepts `allowedRoles` prop; reads role from `useAuth()`; if role not in `allowedRoles`, redirects to `/unauthorized`; otherwise renders `<Outlet />`
    - _Requirements: 5.8_
  - [x] 9.3 Create `frontend/src/App.jsx` — `<BrowserRouter>` with the full React Router v6 nested route tree: public routes (`/login`, `/unauthorized`), `ProtectedRoute` wrapper, `UIShell` layout route, `RoleRoute`-protected dashboard sub-routes (index, minimart, complaint, dormitory, laundry, water-station)
    - _Requirements: 7.1, 7.2, 7.4, 5.4, 5.5, 5.6, 5.7_

- [ ] 10. Frontend pages

  - [x] 10.1 Create `frontend/src/features/auth/LoginForm.jsx` — MUI `<TextField>` inputs for email and password, `<Button>` for submit; calls `login()` from `useAuth()`; shows inline MUI `<Alert>` on error; after success navigates to `redirect` query param or `/dashboard`
    - _Requirements: 2.1, 7.5_
  - [x] 10.2 Create `frontend/src/pages/LoginPage.jsx` — centered MUI `<Card>` layout rendering `<LoginForm />`
    - _Requirements: 2.1_
  - [x] 10.3 Create `frontend/src/pages/UnauthorizedPage.jsx` — MUI `<Typography>` "403 — You don't have permission to access this page" with a link back to `/dashboard`
    - _Requirements: 5.8_
  - [x] 10.4 Create `frontend/src/pages/dashboard/DashboardHome.jsx` — welcome card showing the user's name and role fetched from `useAuth()`
    - _Requirements: 6.2_
  - [x] 10.5 Create the five sub-system placeholder pages: `MinimartPage.jsx`, `ComplaintPage.jsx`, `DormitoryPage.jsx`, `LaundryPage.jsx`, `WaterStationPage.jsx` — each renders the sub-system name heading and "Coming Soon" text inside an MUI `<Box>`
    - _Requirements: 7.3_

- [ ] 11. Frontend integration with UIShell

  - [x] 11.1 Build the nav-items helper in `frontend/src/App.jsx` (or a `navConfig.js`) that defines the full nav items array and filters it by the current user's role according to the UI permission matrix (Admin Dashboard link → admin only; Minimart → admin, staff; others → all)
    - _Requirements: 6.2, 6.3, 6.4_
  - [x] 11.2 Wire `UIShell`, `Sidebar`, and `Topbar` from `@project/mui-structure` into the dashboard layout route in `App.jsx`: pass filtered `navItems`, `activeRoute`, `user`, `onLogout`, and `onMenuOpen` props; implement mobile drawer toggle state; call `logout()` from `onLogout` with a 10-second timeout and show MUI `<Snackbar>` on failure
    - _Requirements: 6.1, 6.5, 6.7, 6.8, 6.9_

- [ ] 12. Backend property-based and unit tests

  - [x] 12.1 Set up Jest config in `backend/package.json` with `mongodb-memory-server` global setup/teardown; install fast-check
    - _Requirements: (testing infrastructure)_
  - [x] 12.2 Write unit tests for `token.service.js` — cover all branches of sign, verify, revoke, and isRevoked (happy path, expired token, revoked token, missing token)
    - _Requirements: 2.4, 3.1, 4.1, 4.2_
  - [ ]\* 12.3 Write property test for Property 1 — Registration Rejects and Reports Invalid Inputs
    - **Property 1: Registration Rejects and Reports Invalid Inputs**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**
    - Generator: `fc.record(...)` with at least one field from invalid domain; assert 4xx + no new User + each failing field named in errors array
  - [ ]\* 12.4 Write property test for Property 2 — Password Storage is Never Plaintext
    - **Property 2: Password Storage is Never Plaintext**
    - **Validates: Requirements 1.6**
    - Generator: valid registration records with arbitrary passwords ≥ 8 chars; assert `passwordHash !== password` and `bcrypt.compare` returns true
  - [ ]\* 12.5 Write property test for Property 3 — Login Credential Rejection is Non-Revealing
    - **Property 3: Login Credential Rejection is Non-Revealing**
    - **Validates: Requirements 2.2, 2.3**
    - Generator: (a) unseen email + any password, (b) seeded email + wrong password; assert both return 401 with identical message strings
  - [ ]\* 12.6 Write property test for Property 4 — Token Expiry Claims Stay Within Defined Bounds
    - **Property 4: Token Expiry Claims Stay Within Defined Bounds**
    - **Validates: Requirements 2.4, 3.1**
    - Generator: arbitrary valid user credentials; assert access token `exp - iat` ∈ [60, 3600] and refresh token `exp - iat` ∈ [518400, 691200]
  - [ ]\* 12.7 Write property test for Property 5 — Refresh Token Rotation Invalidates the Old Token
    - **Property 5: Refresh Token Rotation Invalidates the Old Token**
    - **Validates: Requirements 3.1, 3.2**
    - Generator: arbitrary valid sessions; assert first refresh returns 200 with new token; second call with original cookie returns 401
  - [ ]\* 12.8 Write property test for Property 6 — Revoked Access Token is Rejected on Protected Endpoints
    - **Property 6: Revoked Access Token is Rejected on Protected Endpoints**
    - **Validates: Requirements 4.1, 4.2**
    - Generator: arbitrary valid sessions; call logout; assert subsequent protected-endpoint requests with revoked token return 401
  - [ ]\* 12.9 Write property test for Property 7 — RBAC Returns 403 for Every Unauthorised Role
    - **Property 7: RBAC Returns 403 for Every Unauthorised Role**
    - **Validates: Requirements 5.2, 5.3, 5.5, 5.6, 5.7**
    - Generator: `fc.tuple(fc.constantFrom(...protectedEndpoints), fc.constantFrom('admin','staff','student'))` filtered to unpermitted pairs; assert 403 and no controller side-effect
  - [ ]\* 12.10 Write property test for Property 9 — Every API Response Uses the Standard Envelope
    - **Property 9: Every API Response Uses the Standard Envelope**
    - **Validates: Requirements 8.2, 8.3, 8.6**
    - Generator: arbitrary HTTP requests across all mounted routes (valid, invalid, unknown); assert `success` is boolean, `data` is object/array/null, `message` is string
  - [ ]\* 12.11 Write property test for Property 10 — Validation Error Responses Identify Each Failing Field
    - **Property 10: Validation Error Responses Identify Each Failing Field**
    - **Validates: Requirements 1.3, 1.4, 8.5**
    - Generator: request bodies with tracked invalid fields; assert `response.body.data.errors` array contains each failing field name

- [ ] 13. Frontend property-based and unit tests

  - [x] 13.1 Set up Vitest config in `frontend/package.json` with jsdom, React Testing Library, and fast-check; configure test utilities (render wrapper with AuthContext + ThemeProvider)
    - _Requirements: (testing infrastructure)_
  - [x] 13.2 Write unit tests for `AuthContext`, `ProtectedRoute`, `RoleRoute`
    - _Requirements: 2.1, 4.1, 7.5, 5.8_
  - [x] 13.3 Write unit tests for `axiosInstance`
    - _Requirements: 3.1_
  - [ ]\* 13.4 Write property test for Property 8 — Sidebar Navigation Links Exactly Match the User's Role
    - **Property 8: Sidebar Navigation Links Exactly Match the User's Role**
    - **Validates: Requirements 6.2, 6.3, 6.4**
    - Generator: `fc.constantFrom('admin','staff','student')` → construct user object; assert rendered nav items exactly equal the expected set (set equality)
  - [ ]\* 13.5 Write property test for Property 11 — Topbar Always Displays the Authenticated User's Name and Role
    - **Property 11: Topbar Always Displays the Authenticated User's Name and Role**
    - **Validates: Requirements 6.6**
    - Generator: `fc.record({ name: fc.string({ minLength: 1, maxLength: 100 }), role: fc.constantFrom('admin','staff','student') })`; assert rendered Topbar HTML contains name and role as text nodes
  - [ ]\* 13.6 Write property test for Property 12 — Unauthenticated Access to Protected Routes Redirects to Login
    - **Property 12: Unauthenticated Access to Protected Routes Redirects to Login**
    - **Validates: Requirements 7.5**
    - Generator: `fc.webPath()` for arbitrary protected route paths; assert ProtectedRoute redirects to `/login` with correct `redirect` query param

- [ ] 14. Integration tests

  - [x] 14.1 Write Supertest integration tests for the full auth flow
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 4.1, 4.2, 4.3_
  - [x] 14.2 Write Supertest integration tests for RBAC enforcement
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 14.3 Write Supertest integration tests for envelope format
    - _Requirements: 8.2, 8.3, 8.6_

- [x] 15. Final checkpoint
  - Ensure all tests pass (`npm test --workspaces`). Fix any type errors, import mismatches, or test failures. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties (design doc Properties 1–12)
- Unit tests validate specific examples, edge cases, and error paths
- All backend tests use `mongodb-memory-server`; no real MongoDB instance required for CI
- Prettier is applied at the root level; run `npx prettier --write .` before committing

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "3.2", "3.5"] },
    { "id": 4, "tasks": ["2.3", "2.4", "3.3", "4.1", "4.2"] },
    { "id": 5, "tasks": ["2.5", "3.4", "5.1", "6.3"] },
    { "id": 6, "tasks": ["2.6", "6.1", "6.2", "6.4"] },
    { "id": 7, "tasks": ["7.1", "8.1"] },
    { "id": 8, "tasks": ["7.2", "8.2", "8.3", "8.4"] },
    { "id": 9, "tasks": ["7.3", "9.1", "9.2"] },
    { "id": 10, "tasks": ["9.3", "10.1"] },
    { "id": 11, "tasks": ["10.2", "10.3", "10.4", "10.5"] },
    { "id": 12, "tasks": ["11.1"] },
    { "id": 13, "tasks": ["11.2", "12.1", "13.1"] },
    { "id": 14, "tasks": ["12.2", "13.2", "13.3"] },
    {
      "id": 15,
      "tasks": [
        "12.3",
        "12.4",
        "12.5",
        "12.6",
        "12.7",
        "12.8",
        "12.9",
        "12.10",
        "12.11",
        "13.4",
        "13.5",
        "13.6"
      ]
    },
    { "id": 16, "tasks": ["14.1", "14.2", "14.3"] }
  ]
}
```
