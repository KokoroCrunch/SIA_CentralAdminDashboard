# Requirements Document

## Introduction

The Central Admin Dashboard is a MERN-stack web application that serves as the unified hub for a multi-system campus management platform. It integrates six sub-systems — Minimart/Point of Sales, Complaint, Dormitory Reservation, Laundry, and Water Station — under a single authenticated interface. The dashboard provides role-based access control for three user types (Admin, Staff, Student), a consistent MUI-based UI shell, and a well-structured REST API layer. The project is organized as a monorepo with three clearly separated concerns: Frontend (React), MUI Structure (shared component library), and Backend (Express/Node.js with MongoDB).

---

## Glossary

- **Dashboard**: The Central Admin Dashboard web application described in this document.
- **Auth_Service**: The backend service responsible for user registration, login, and JWT token management.
- **RBAC_Service**: The Role-Based Access Control service that enforces permission rules across all routes and UI elements.
- **User**: Any person interacting with the Dashboard (Admin, Staff, or Student).
- **Admin**: A User role with full access to all sub-systems, user management, and configuration.
- **Staff**: A User role with access to assigned sub-systems and operational views.
- **Student**: A User role with access to personal-use features of the integrated sub-systems.
- **JWT**: JSON Web Token used for stateless authentication between the Frontend and Backend.
- **Access_Token**: A short-lived JWT issued upon successful login, used to authorize API requests.
- **Refresh_Token**: A long-lived token used to obtain a new Access_Token without re-authenticating.
- **UI_Shell**: The persistent layout wrapper (sidebar, topbar, content area) rendered after authentication.
- **Sub_System**: One of the six integrated systems: Minimart/POS, Complaint, Dormitory Reservation, Laundry, Water Station, and Central Admin Dashboard itself.
- **API**: The RESTful HTTP interface exposed by the Backend layer.
- **MUI**: Material UI, the React component library used for all UI elements.
- **Monorepo**: A single Git repository containing all three layers: `frontend/`, `mui-structure/`, and `backend/`.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As an Admin, I want to register new user accounts with assigned roles, so that Staff and Students can access the appropriate sub-systems.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/register` by an authenticated Admin with a name (1–100 characters), a valid email address, a password of at least 8 characters, and a role value from `["admin", "staff", "student"]`, THE Auth_Service SHALL create a new User record in the database and return a `201 Created` response with the created User's id, name, email, and role.
2. IF a POST request is made to `/api/auth/register` with an email that already exists in the database (case-insensitive match), THEN THE Auth_Service SHALL return a `409 Conflict` response with a descriptive error message.
3. IF a POST request is made to `/api/auth/register` with one or more missing required fields (name, email, password, or role), THEN THE Auth_Service SHALL return a `400 Bad Request` response listing each missing field name.
4. IF a POST request is made to `/api/auth/register` with all required fields present but one or more fields failing format or constraint validation (e.g., email not a valid address, password fewer than 8 characters, name exceeding 100 characters), THEN THE Auth_Service SHALL return a `400 Bad Request` response identifying each invalid field and the violated constraint.
5. IF a POST request is made to `/api/auth/register` with a role value outside of `["admin", "staff", "student"]`, THEN THE Auth_Service SHALL return a `400 Bad Request` response indicating the invalid role value.
6. THE Auth_Service SHALL store passwords as bcrypt hashes and SHALL NOT store plaintext passwords.

---

### Requirement 2: User Login

**User Story:** As a User, I want to log in with my email and password, so that I receive a token that grants me access to the Dashboard.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/login` with a valid email and password, THE Auth_Service SHALL return a `200 OK` response containing an Access_Token and a Refresh_Token.
2. IF a POST request is made to `/api/auth/login` with an email that does not exist in the database, THEN THE Auth_Service SHALL return a `401 Unauthorized` response with a message that does not reveal whether the email or password was incorrect.
3. IF a POST request is made to `/api/auth/login` with a correct email but incorrect password, THEN THE Auth_Service SHALL return a `401 Unauthorized` response with a message that does not reveal whether the email or password was incorrect.
4. THE Auth_Service SHALL sign the Access_Token with an expiry of 15 minutes and the Refresh_Token with an expiry of 7 days.
5. WHEN a login is successful, THE Auth_Service SHALL set the Refresh_Token as an HTTP-only cookie in the response.
6. IF a POST request is made to `/api/auth/login` with a missing or malformed request body (e.g., absent email or password field), THEN THE Auth_Service SHALL return a `400 Bad Request` response identifying each missing or invalid field.
7. IF a POST request is made to `/api/auth/login` with an email field that is not a valid email address format, THEN THE Auth_Service SHALL return a `400 Bad Request` response indicating the email field is invalid.

---

### Requirement 3: JWT Token Refresh

**User Story:** As a User, I want my session to be automatically renewed, so that I am not logged out while actively using the Dashboard.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/refresh` with a valid Refresh_Token cookie, THE Auth_Service SHALL return a `200 OK` response containing a new Access_Token with an expiry duration between 1 and 60 minutes, and SHALL set a new Refresh_Token cookie replacing the previous one.
2. IF a POST request is made to `/api/auth/refresh` with an expired, invalid, malformed, or absent Refresh_Token cookie, THEN THE Auth_Service SHALL return a `401 Unauthorized` response and clear the Refresh_Token cookie.
3. IF a POST request is made to `/api/auth/refresh` with a Refresh_Token whose signature does not pass verification, THEN THE Auth_Service SHALL return a `401 Unauthorized` response and clear the Refresh_Token cookie.

---

### Requirement 4: User Logout

**User Story:** As a User, I want to log out of the Dashboard, so that my session is invalidated and my credentials are no longer active.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/logout` with a valid Access_Token in the `Authorization: Bearer` header, THE Auth_Service SHALL return a `200 OK` response, clear the Refresh_Token cookie, and add the Access_Token to a server-side revocation list so it cannot be used for further requests.
2. THE Auth_Service SHALL invalidate the Refresh_Token on logout by removing it from the server-side token store. IF the Refresh_Token is already absent from the store, THE Auth_Service SHALL still return a `200 OK` response.
3. IF a POST request is made to `/api/auth/logout` without a valid Access_Token in the `Authorization: Bearer` header (missing, malformed, or expired), THEN THE Auth_Service SHALL return a `401 Unauthorized` response and SHALL NOT modify the token store or cookie.

---

### Requirement 5: Role-Based Access Control

**User Story:** As a system architect, I want each API endpoint and UI route to be protected by role-based rules, so that Users can only access resources permitted for their role.

#### Acceptance Criteria

1. THE RBAC_Service SHALL define three roles — `admin`, `staff`, and `student` — each mapped to a distinct set of permitted API routes and UI routes in a permission matrix.
2. WHEN a request is made to a protected API endpoint with an absent, malformed, or expired Access_Token in the `Authorization: Bearer` header, THE RBAC_Service SHALL return a `401 Unauthorized` response and SHALL NOT process the request.
3. WHEN a request is made to a protected API endpoint with a valid Access_Token but a role that does not have permission for that endpoint according to the permission matrix, THE RBAC_Service SHALL return a `403 Forbidden` response.
4. THE RBAC_Service SHALL grant `admin` role access to all API endpoints and all UI routes.
5. THE RBAC_Service SHALL grant `staff` role access to operational API endpoints and UI views belonging to the Sub_Systems assigned to that staff member, and SHALL deny access to user management endpoints.
6. THE RBAC_Service SHALL deny `staff` role access to any API endpoint or UI route outside of the staff member's assigned Sub_Systems and SHALL deny access to all user management endpoints.
7. THE RBAC_Service SHALL grant `student` role access only to personal-use endpoints (own reservations, own complaints, own laundry/water station records).
8. WHEN any User attempts to navigate to a UI route not permitted for their role, THE Dashboard SHALL redirect the User to the `/unauthorized` page.

---

### Requirement 6: Admin Dashboard Layout (UI Shell)

**User Story:** As a User, I want a consistent and responsive layout after logging in, so that I can navigate between sub-systems without losing context.

#### Acceptance Criteria

1. THE UI_Shell SHALL render a persistent sidebar, a top navigation bar, and a main content area on all authenticated routes, where "persistent" means the sidebar remains visible and does not collapse or re-render when the active route changes.
2. THE UI_Shell SHALL display navigation links for all six Sub_Systems in the sidebar: Minimart/POS, Complaint, Dormitory Reservation, Laundry, Water Station, and Admin Dashboard.
3. WHEN the User's role is `student`, THE UI_Shell SHALL display only the following Sub_System links in the sidebar: Complaint, Dormitory Reservation, Laundry, and Water Station.
4. WHEN the User's role is `staff`, THE UI_Shell SHALL display only the following Sub_System links in the sidebar: Minimart/POS, Complaint, Dormitory Reservation, Laundry, and Water Station.
5. WHILE the viewport width is less than 768px, THE UI_Shell SHALL not display the sidebar, and SHALL render a menu button in the top navigation bar that, when clicked, opens the sidebar as an overlay drawer.
6. THE UI_Shell SHALL display the authenticated User's name and role in the top navigation bar.
7. WHEN the User clicks the logout button in the top navigation bar, THE UI_Shell SHALL call the logout API and, upon receiving a successful response within 10 seconds, redirect the User to the `/login` page.
8. IF the logout API call fails or does not respond within 10 seconds, THEN THE UI_Shell SHALL display an error notification to the User and remain on the current page.
9. THE UI_Shell SHALL visually distinguish the currently active sidebar navigation link from inactive links (e.g., via a highlight, bold weight, or accent color).

---

### Requirement 7: Sub-System Navigation and Integration

**User Story:** As a User, I want to navigate to each integrated sub-system from the Dashboard, so that I can access all campus services from a single interface.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a clickable sidebar link for each of the following Sub_Systems: Minimart/POS, Complaint, Dormitory Reservation, Laundry, and Water Station.
2. WHEN a User clicks a Sub_System link in the sidebar, THE Dashboard SHALL render the corresponding sub-system view within the UI_Shell's main content area without triggering a full-page navigation.
3. WHEN a Sub_System is not yet implemented, THE Dashboard SHALL render a placeholder page containing the text "Coming Soon" within the UI_Shell's main content area.
4. WHEN a User navigates directly to a sub-system URL (e.g., `/dashboard/laundry`) while authenticated, THE Dashboard SHALL render the correct sub-system view within the UI_Shell.
5. IF a User navigates directly to a sub-system URL while not authenticated, THEN THE Dashboard SHALL redirect the User to the `/login` page and, after successful login, redirect the User back to the originally requested URL.

---

### Requirement 8: API Standards

**User Story:** As a backend developer, I want all API endpoints to follow a consistent structure and response format, so that frontend integration and debugging are predictable.

#### Acceptance Criteria

1. THE API SHALL prefix all routes with `/api/v1/` to support versioning.
2. THE API SHALL return all responses in JSON format with a consistent envelope: `{ "success": boolean, "data": object | array | null, "message": string }`.
3. IF an unhandled error occurs in the Backend, THEN THE API SHALL return a `500 Internal Server Error` response using the standard envelope format with `"success": false` and a message that does not expose stack traces, file paths, or internal identifiers, and SHALL log the full error details server-side.
4. THE API SHALL accept and return dates in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`).
5. THE API SHALL validate all incoming request bodies using a schema validation library and return `400 Bad Request` with an errors array where each entry identifies the field name and the reason for rejection.
6. IF a request is made to an API route that does not exist, THEN THE API SHALL return a `404 Not Found` response using the standard envelope format with `"success": false`.

---

### Requirement 9: GitHub Monorepo Structure

**User Story:** As a developer, I want the project organized in a clear monorepo structure, so that the frontend, shared MUI components, and backend can be developed and deployed independently while sharing a single repository.

#### Acceptance Criteria

1. THE Monorepo SHALL contain the following top-level directories: `frontend/`, `mui-structure/`, and `backend/`.
2. THE `frontend/` directory SHALL contain the React application with its own `package.json`.
3. THE `mui-structure/` directory SHALL contain shared MUI-based React components, a theme configuration file, and design tokens defined as a structured constants file (e.g., colors, spacing, typography scale), each with its own `package.json`.
4. THE `backend/` directory SHALL contain the Express/Node.js application with its own `package.json`.
5. THE Monorepo SHALL contain a root-level `package.json` with the following workspace scripts: `install:all` (installs dependencies for all three packages), `dev` (starts development servers for `frontend/` and `backend/` concurrently), and `test` (runs test suites for all three packages).
6. THE Monorepo SHALL contain a root-level `.env.example` file documenting all required environment variables for both `frontend/` and `backend/`.
7. THE `frontend/` application SHALL reference shared components from `mui-structure/` as a local package dependency using the workspace protocol (e.g., `"@project/mui-structure": "workspace:*"`).
8. THE root-level `package.json` SHALL declare `frontend/`, `mui-structure/`, and `backend/` as workspace packages so that dependency hoisting and cross-package linking function correctly.
