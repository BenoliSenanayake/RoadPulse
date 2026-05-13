# RoadPulse Technical Documentation Report

Project title: RoadPulse - AI-Based Pothole Detection and Location Reporting System

Project type: Full-stack AI-assisted web application

Primary implementation inspected:

- Frontend source: `src/`
- Backend source: `backend/app/`
- Backend routers: `backend/app/routers/`
- Backend services: `backend/app/services/`
- Active frontend entry points: `src/main.tsx`, `src/App.tsx`
- Active backend entry point: `backend/app/main.py`

Important implementation note: the repository also contains a nested `Dashboard/` folder with a duplicate-looking frontend tree. The active application at the repository root is the one referenced by the root `package.json`, root Vite config, and root `src/` directory. This report therefore treats the root `src/` tree as the primary frontend source of truth.

Security note: environment variables and secrets are referenced by name only. Secret values discovered in local `.env` files are intentionally not reproduced in this document.

---

## Section 1 - Executive System Overview

### 1.1 System Purpose

RoadPulse is a citizen-driven road damage reporting and maintenance management platform. It enables citizens to submit pothole reports with image evidence, GPS coordinates, and contextual descriptions. The platform then routes the report to the relevant maintenance authority, supports AI-assisted pothole verification through Roboflow inference, and provides role-specific dashboards for citizens, maintenance officers, and administrators.

The system combines three major operational concerns:

1. Public reporting: citizens can report road damage from a mobile-friendly web interface.
2. Maintenance triage: provincial maintenance officers can inspect, verify, schedule, and complete repair work.
3. Governance oversight: administrators can monitor all provinces, manage users, review audit logs, and correct jurisdictional metadata.

### 1.2 Real-World Problem Addressed

Potholes and road surface failures are common safety and infrastructure issues. Traditional reporting methods often rely on phone calls, informal complaints, manual inspection, or fragmented paper-based workflows. These approaches suffer from several weaknesses:

- Reports may not include accurate coordinates.
- Reports may not include visual proof.
- Maintenance teams may not know which authority is responsible.
- Duplicate or low-quality reports may consume officer time.
- Citizens often cannot track what happened after submitting a complaint.
- Central administrators lack live visibility into regional maintenance performance.

RoadPulse addresses these issues by creating a structured digital reporting pipeline. A report is captured with image and GPS evidence, stored in a relational database, analyzed using AI, routed to a provincial council, and exposed through operational dashboards.

### 1.3 Why the System Is Needed

The system is needed because road maintenance is both geographically distributed and time-sensitive. A pothole has a specific physical location, belongs to a jurisdiction, may have different urgency levels, and should be traceable from submission to completion. RoadPulse provides the technical infrastructure to support this lifecycle:

- Image-backed reporting improves trust.
- GPS coordinates reduce ambiguity.
- AI classification reduces manual workload.
- Provincial routing keeps officers focused on their own jurisdiction.
- Status tracking improves transparency.
- Audit logs support accountability.
- Dashboards support decision-making and performance monitoring.

### 1.4 Target Users

The implementation defines three user roles in `src/types.ts` and `backend/app/models.py`:

| User role | Backend role value | Purpose |
|---|---|---|
| Citizen | `CITIZEN` | Public users who submit pothole reports and track their own report progress. |
| Maintenance officer | `MAINTENANCE_OFFICER` | Provincial staff who view and manage reports assigned to their provincial council. |
| Administrator | `ADMIN` | Global system operators with access to all reports, users, audit logs, and province analytics. |

### 1.5 Platform Goals

The system goals are:

- Provide an accessible citizen reporting workflow.
- Capture reliable photo and location evidence.
- Use AI to classify pothole evidence where possible.
- Route reports to the correct provincial council.
- Give maintenance officers a dashboard for triage and repair tracking.
- Give administrators national-level visibility and control.
- Persist audit records for important workflow events.
- Keep frontend and backend models normalized through a typed API adapter.

### 1.6 High-Level Workflow

The core workflow is:

1. Citizen signs up or logs in through the citizen portal.
2. Citizen opens `/citizen/report`.
3. Citizen captures or uploads an image.
4. Citizen selects GPS location through browser geolocation or a Leaflet map.
5. Citizen enters optional road name and description.
6. Frontend builds `FormData` and submits it to `POST /reports`.
7. Backend saves the uploaded image into `uploads/`.
8. Backend creates a public image URL using `BACKEND_PUBLIC_URL` and `/static/{filename}`.
9. Backend sends the image to Roboflow through `backend/app/services/roboflow_service.py`.
10. AI output is converted into RoadPulse classification values:
    - `VERIFIED_POTHOLE`
    - `NEEDS_MANUAL_REVIEW`
    - `REJECTED`
11. Backend resolves province and district from latitude/longitude using `backend/app/services/province_resolver.py`.
12. Backend inserts a `citizen_reports` row.
13. Backend inserts a `detection_results` row where possible.
14. Backend inserts an `audit_logs` row where possible.
15. Citizen can view report status through `/citizen/status/:id`.
16. Staff dashboards poll and show the report if it belongs to the officer's province.
17. Staff update lifecycle states such as `Verified`, `Scheduled`, `In Progress`, and `Completed`.
18. Admin dashboards provide global reporting, corrections, user management, and audit visibility.

### 1.7 Major System Modules

| Module | Primary files | Description |
|---|---|---|
| Portal routing | `src/App.tsx` | Selects citizen, staff, or admin route tree using `VITE_PORTAL_MODE`. |
| Authentication context | `src/context/AuthContext.tsx` | Maintains session user, JWT token, role logic, login/signup/logout methods. |
| Protected routes | `src/components/ProtectedRoute.tsx` | Enforces authentication, portal separation, and role-level access. |
| API client | `src/lib/api.ts` | Provides report, pothole, auth, audit, and settings API functions. Normalizes backend data. |
| Citizen reporting | `src/pages/citizen/ReportWizard.tsx` | Multi-step evidence, location, details, review, and submission flow. |
| Citizen tracking | `src/pages/citizen/MyReports.tsx`, `src/pages/citizen/ReportStatus.tsx` | Lists user reports and renders lifecycle timeline. |
| Staff overview | `src/pages/MaintenanceOverview.tsx` | Province-scoped operational summary cards. |
| Staff map | `src/pages/LiveMap.tsx` | Province-scoped Leaflet map with marker clustering and maintenance status actions. |
| Staff report operations | `src/pages/FilteredReportList.tsx`, `src/pages/StaffReportDetail.tsx` | Queues, pagination, quick actions, detailed lifecycle management. |
| Admin oversight | `src/pages/Overview.tsx`, `src/pages/AdminReports.tsx`, `src/pages/AdminReportDetail.tsx`, `src/pages/ProvinceMonitoring.tsx`, `src/pages/Users.tsx`, `src/pages/AuditLogs.tsx`, `src/pages/Settings.tsx` | National-level monitoring, governance, user management, and audit visibility. |
| FastAPI app | `backend/app/main.py` | Creates FastAPI app, CORS, static upload serving, routes, DB tables. |
| Auth router | `backend/app/routers/auth.py` | Login, signup, user listing, user update, email checks. |
| Reports router | `backend/app/routers/reports.py` | Report creation, querying, status updates, province stats, audit history. |
| AI router | `backend/app/routers/ai.py` | Direct staff-only image analysis endpoint. Contains an implementation issue described later. |
| Roboflow service | `backend/app/services/roboflow_service.py` | Calls Roboflow inference and maps response into RoadPulse detection fields. |
| Province resolver | `backend/app/services/province_resolver.py`, `src/lib/provinceResolver.ts` | Approximate Sri Lankan provincial boundary and district assignment logic. |
| Database models | `backend/app/models.py` | SQLAlchemy models for users, reports, detection results, audit logs, and status updates. |

### 1.8 Key Innovations

The project's innovation is not just pothole image upload, but the integration of reporting, routing, AI classification, and role-based operational dashboards:

- Citizen-to-government reporting pipeline.
- AI-assisted pothole verification.
- Province-aware jurisdiction routing.
- Multi-portal architecture from one React codebase.
- Live map view using Leaflet and marker clustering.
- Maintenance lifecycle tracking from submission to completion.
- Administrative override and audit visibility.
- Typed frontend normalization layer bridging backend snake_case and frontend camelCase.

---

## Section 2 - Complete System Architecture

### 2.1 Overall Architecture

RoadPulse uses a client-server architecture:

- The frontend is a React TypeScript single-page application built with Vite.
- The backend is a FastAPI application that exposes REST endpoints.
- PostgreSQL is the intended production database, accessed through SQLAlchemy ORM.
- Roboflow is used as an external AI inference service.
- Uploaded evidence images are stored on the backend filesystem under `uploads/` and served through FastAPI static files at `/static`.

Logical architecture:

```text
Citizen browser / Staff browser / Admin browser
                |
                | HTTP REST + Bearer JWT
                v
          FastAPI backend
                |
      ----------------------
      |                    |
 SQLAlchemy ORM       Roboflow API
      |                    |
 PostgreSQL           AI detections
      |
 Relational data:
 users, citizen_reports,
 detection_results,
 audit_logs, status_updates
```

### 2.2 Frontend-Backend Communication Flow

The frontend communicates with the backend through `src/lib/api.ts`.

Important implementation details:

- `API_BASE_URL` is loaded from `VITE_API_BASE_URL`, defaulting to `http://localhost:8000`.
- `PORTAL_MODE` is loaded from `VITE_PORTAL_MODE`, defaulting to `citizen`.
- `apiClient.getHeaders()` reads `roadpulse_token` from `localStorage`.
- If a token exists, it injects `Authorization: Bearer {token}`.
- JSON requests include `Content-Type: application/json`.
- Multipart report submissions send `FormData` without setting `Content-Type` manually, allowing the browser to set the boundary.

The API client intentionally disables mock data:

```ts
export const USE_MOCK = false;
```

The `withFallback` helper in `src/lib/api.ts` throws when the backend is unavailable for staff/admin portals and when `USE_MOCK` is false. This supports database-backed correctness rather than silently showing demo data.

### 2.3 Database Communication Flow

Database connectivity is implemented in `backend/app/database.py`.

Key flow:

1. `settings.DATABASE_URL` is loaded in `backend/app/config.py`.
2. SQLAlchemy creates an engine using `create_engine(settings.DATABASE_URL)`.
3. `SessionLocal` is configured using `sessionmaker`.
4. FastAPI dependencies call `get_db()`.
5. `get_db()` yields a SQLAlchemy session and closes it after request completion.

The backend currently creates tables at startup:

```py
Base.metadata.create_all(bind=engine)
```

This appears in `backend/app/main.py`. This is useful for development and prototyping, but for production a migration tool such as Alembic should become the authoritative schema management mechanism.

### 2.4 Authentication Architecture

Authentication is JWT-based:

- Password hashing is implemented with `passlib` bcrypt in `backend/app/security.py`.
- JWTs are signed using `HS256`.
- Token claims include at least:
  - `sub`: user email
  - `role`: user role
  - `exp`: expiration timestamp
- Token expiry is set to 24 hours in development:
  - `ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24`

Frontend session persistence:

- User object is stored in `localStorage` as `rp_user`.
- JWT token is stored in `localStorage` as `roadpulse_token`.
- Province is stored in `localStorage` and `sessionStorage` under `provincialCouncil`.

Role checking is done in two layers:

1. Frontend route layer: `src/components/ProtectedRoute.tsx`.
2. Backend dependency layer: `require_admin`, `require_staff`, and `require_citizen` in `backend/app/security.py`.

### 2.5 AI Processing Pipeline

AI integration is implemented through `backend/app/services/roboflow_service.py`.

Pipeline:

1. Backend receives uploaded image in `POST /reports`.
2. Backend saves image to disk.
3. Backend calls `analyze_pothole_image(file_path)`.
4. `analyze_pothole_image` calls Roboflow using `InferenceHTTPClient`.
5. If SDK import fails, a fallback class performs direct HTTP upload to Roboflow's detection endpoint.
6. Roboflow predictions are parsed.
7. The highest-confidence prediction is selected.
8. Bounding box values are normalized relative to image width and height.
9. Confidence thresholds determine classification:
   - `>= 0.75`: `VERIFIED_POTHOLE`
   - `>= 0.50`: `NEEDS_MANUAL_REVIEW`
   - `< 0.50`: `REJECTED`
   - no predictions: `REJECTED`
   - inference error: `NEEDS_MANUAL_REVIEW`
10. Result is stored in `citizen_reports` and `detection_results`.

### 2.6 File Upload Pipeline

Report evidence upload is handled in `backend/app/routers/reports.py`.

Flow:

1. Frontend creates `FormData` in `src/pages/citizen/ReportWizard.tsx`.
2. It appends:
   - `latitude`
   - `longitude`
   - `description`
   - `image`
   - `citizen_id` is appended by the frontend, but backend derives the actual citizen ID from the authenticated user.
3. Backend endpoint accepts:
   - `latitude: float = Form(...)`
   - `longitude: float = Form(...)`
   - `description: Optional[str] = Form(None)`
   - `address: Optional[str] = Form(None)`
   - `image: UploadFile = File(...)`
4. Backend creates `uploads/` if needed.
5. Backend generates a UUID filename and preserves the submitted extension.
6. Backend writes the file to disk.
7. Backend exposes image through `/static/{filename}`.
8. The public image URL is written to `citizen_reports.image_url`.

Engineering benefit:

- The database stores only metadata and URL references, avoiding large binary objects in PostgreSQL.

Current limitation:

- Backend does not currently enforce MIME type, extension whitelist, file size limit, or antivirus scanning.
- Frontend compresses the image for preview, but submits the original `File` object to the backend.

### 2.7 Synchronization Architecture

RoadPulse uses polling-based synchronization rather than WebSockets.

Polling implementation examples:

- `src/pages/citizen/MyReports.tsx`: reloads reports every 30 seconds.
- `src/pages/MaintenanceOverview.tsx`: reloads dashboard data every 30 seconds.
- `src/pages/LiveMap.tsx`: reloads map data every 30 seconds.
- `src/pages/Overview.tsx`: admin overview reloads every 30 seconds.
- `src/components/BackendStatusBanner.tsx`: checks backend/database health every 10 seconds.
- `src/pages/ReviewQueue.tsx`: legacy review queue polls every 30 seconds.

Why polling was selected:

- It is simple to implement.
- It works with standard REST endpoints.
- It avoids persistent connection management.
- It is sufficient for a university prototype and moderate-scale dashboard.

Scalability limitation:

- Multiple dashboards polling `limit: 1000` reports can increase backend and database load as data grows.
- Future production versions should consider WebSockets, server-sent events, cache invalidation, or background refresh workers.

### 2.8 Dashboard Architecture

The dashboard architecture is role-specific:

- Citizen dashboard focuses on personal submissions and status transparency.
- Staff dashboard focuses on province-limited operations.
- Admin dashboard focuses on global governance and analytics.

The same React codebase supports all dashboards. `src/App.tsx` chooses the route tree based on `VITE_PORTAL_MODE`:

- `.env.citizen` sets `VITE_PORTAL_MODE=citizen`
- `.env.staff` sets `VITE_PORTAL_MODE=staff`
- `.env.admin` sets `VITE_PORTAL_MODE=admin`

Root package scripts:

- `npm run dev:citizen` runs the citizen portal on port `5173`.
- `npm run dev:staff` runs the staff portal on port `5174`.
- `npm run dev:admin` runs the admin portal on port `5175`.

This is a pragmatic multi-portal architecture. It allows separate portal deployments while preserving shared components, API utilities, types, and styling.

### 2.9 State Management Architecture

The frontend uses React local state and Context API rather than Redux or another global store.

Global state:

- `AuthContext` manages authentication state.

Local page state:

- Form values, filters, loading state, error messages, selected records, and pagination live inside page components.

Shared normalization:

- `src/lib/api.ts` centralizes backend response mapping.
- `src/lib/status.ts` centralizes status canonicalization.
- `src/lib/provinceResolver.ts` centralizes province and district normalization.
- `src/lib/staffReportFilters.ts` centralizes staff dashboard predicates.

This architecture is maintainable because cross-cutting concerns are extracted into small library modules while page-specific UI state stays close to its component.

### 2.10 Route Protection Architecture

Frontend route protection is implemented by `src/components/ProtectedRoute.tsx`.

It checks:

1. A user exists in `AuthContext`.
2. A JWT exists in `localStorage`.
3. The current portal mode matches the user's role.
4. The route's `allowedRoles` contains the user's role.

When unauthenticated:

- Citizen portal redirects to `/login`.
- Staff portal redirects to `/staff/login`.
- Admin portal redirects to `/admin/login`.

When authenticated with the wrong portal role:

- It renders a portal restriction message instead of redirecting.

Backend route protection:

- `require_citizen` protects report submission.
- `require_staff` protects staff/admin operational endpoints.
- `require_admin` protects admin-only endpoints.
- `get_current_user` validates bearer tokens and retrieves the user by email.

### 2.11 Multi-Role System Architecture

The multi-role architecture is enforced in several layers:

| Layer | Mechanism |
|---|---|
| Build/runtime portal mode | `VITE_PORTAL_MODE` selects citizen/staff/admin routes. |
| UI protection | `ProtectedRoute` checks current role and portal mode. |
| Session logic | `AuthContext.login()` branches by portal mode and validates expected role. |
| Staff province login | Staff login requires selected provincial council and backend checks it against the stored user province. |
| Backend authentication | JWT bearer token validates identity. |
| Backend authorization | Role dependencies restrict endpoint access. |
| Backend jurisdiction checks | Staff users can only view/update reports from their assigned `provincial_council`. |

### 2.12 Technology Selection Rationale

Frontend:

- React supports component-driven UI development and reusable dashboards.
- TypeScript improves data model accuracy across complex role-specific flows.
- Vite provides fast development and simple environment modes.
- Tailwind CSS enables consistent utility-first styling.
- React Router provides route trees and protected page composition.
- Leaflet and React Leaflet are mature open-source mapping tools.
- Recharts supports dashboard analytics.
- Context API is sufficient because global state is mostly authentication state.

Backend:

- FastAPI provides high-performance REST APIs, automatic OpenAPI docs, and native Pydantic validation.
- SQLAlchemy provides ORM mapping and database session management.
- Pydantic models provide typed request/response schemas.
- JWT supports stateless authentication.
- PostgreSQL is suitable for relational reporting, user management, audit trails, and geospatial extensibility.

AI:

- Roboflow provides hosted model inference without requiring local GPU infrastructure.
- API-based inference reduces deployment complexity for a university prototype.
- External inference allows the web application to focus on workflow integration rather than ML training infrastructure.

### 2.13 Scalability Considerations

Current scalable qualities:

- Stateless JWT authentication allows horizontal backend scaling.
- PostgreSQL can support indexes, backups, query optimization, and future GIS extensions.
- Image metadata is stored in the database while files remain outside the relational store.
- Frontend can be built into static assets and deployed independently from the API.

Current scaling constraints:

- Filesystem upload storage is local to one backend instance.
- Polling with large `limit: 1000` requests does not scale indefinitely.
- `Base.metadata.create_all()` is not sufficient for production schema evolution.
- Province resolution uses approximate bounding boxes rather than true GIS boundaries.
- `audit_logs` and `status_updates` do not currently have explicit indexes on `report_id` in the model definitions.
- CORS is currently open to all origins.

### 2.14 Maintainability Considerations

Strengths:

- Route trees are clearly separated by role in `src/App.tsx`.
- API normalization is centralized in `src/lib/api.ts`.
- Status and province canonicalization are centralized in library files.
- Backend routers are separated by domain: auth, reports, AI.
- SQLAlchemy models provide a clear table-level domain model.

Weaknesses:

- Some legacy pages remain in `src/pages/` but are not active routes.
- Backend and frontend audit action vocabularies are not fully aligned.
- Some frontend filters are sent to the backend but ignored by the current backend implementation.
- There are duplicated concepts between `CitizenReport` and `PotholeEvent`; `PotholeEvent` is currently a frontend mapping over reports rather than a separate backend table.
- Backend transaction boundaries use multiple commits per request in some flows, which can produce partial success if optional persistence fails.

---

## Section 3 - Frontend System Analysis

### 3.1 Overall Frontend Structure

Important frontend directories:

```text
src/
  App.tsx
  main.tsx
  index.css
  types.ts
  context/
    AuthContext.tsx
  lib/
    api.ts
    status.ts
    provinceResolver.ts
    staffReportFilters.ts
    aiValidationService.ts
    utils.ts
  components/
    AdminLayout.tsx
    CitizenLayout.tsx
    StaffLayout.tsx
    ProtectedRoute.tsx
    StatusPill.tsx
    ActivityTimeline.tsx
    EvidenceViewer.tsx
    ResponsiveDataList.tsx
    Pagination.tsx
    AuthInput.tsx
    Alert.tsx
    BackendStatusBanner.tsx
    EmptyState.tsx
    Skeleton.tsx
    Logo.tsx
  pages/
    Login.tsx
    Signup.tsx
    StaffLogin.tsx
    Overview.tsx
    AdminReports.tsx
    AdminReportDetail.tsx
    ProvinceMonitoring.tsx
    Users.tsx
    AuditLogs.tsx
    Settings.tsx
    MaintenanceOverview.tsx
    LiveMap.tsx
    FilteredReportList.tsx
    StaffReportDetail.tsx
    ReportMaintenanceHistory.tsx
    citizen/
      CitizenHome.tsx
      ReportWizard.tsx
      MyReports.tsx
      ReportStatus.tsx
```

The frontend is organized into:

- Role-specific page modules.
- Shared layout components.
- Shared data utilities.
- Shared visual components.
- Centralized type definitions.

### 3.2 Component Hierarchy

The top-level component hierarchy is:

```text
main.tsx
  React.StrictMode
    App
      ErrorBoundary
        AuthProvider
          BrowserRouter
            PortalRouter
              CitizenApp OR StaffApp OR AdminApp
                Routes
                  ProtectedRoute
                    Layout
                      Page component
```

`src/App.tsx` contains:

- `ErrorBoundary`
- `CitizenApp`
- `StaffApp`
- `AdminApp`
- `PortalRouter`
- `App`

The `ErrorBoundary` prevents a complete blank screen if a component fails during render. It renders a full-screen diagnostic page with the error message and a reload button.

### 3.3 Routing System

Routing is implemented with `react-router-dom` in `src/App.tsx`.

Citizen routes:

| Route | Component | Protection |
|---|---|---|
| `/` | Redirect to `/citizen` | Public |
| `/citizen` | `CitizenHome` inside `CitizenLayout` | Public |
| `/login` | `LoginPage` | Public |
| `/signup` | `SignupPage` | Public |
| `/citizen/login` | Redirect to `/login` | Public |
| `/citizen/signup` | Redirect to `/signup` | Public |
| `/citizen/report` | `ReportWizard` inside `CitizenLayout` | `CITIZEN` |
| `/citizen/my-reports` | `MyReports` inside `CitizenLayout` | `CITIZEN` |
| `/citizen/status/:id` | `ReportStatus` inside `CitizenLayout` | Frontend route public, backend API requires JWT |
| `*` | Redirect to `/citizen` | Public |

Staff routes:

| Route | Component | Protection |
|---|---|---|
| `/` | Redirect to `/staff/login` | Public |
| `/staff/login` | `StaffLogin` | Public |
| `/staff/overview` | `MaintenanceOverview` inside `StaffLayout` | `MAINTENANCE_OFFICER` |
| `/staff/map` | `LiveMap` inside `StaffLayout` | `MAINTENANCE_OFFICER` |
| `/staff/report-history` | `ReportMaintenanceHistory` inside `StaffLayout` | `MAINTENANCE_OFFICER` |
| `/staff/reports/verified` | `FilteredReportList` | `MAINTENANCE_OFFICER` |
| `/staff/reports/manual-review` | `FilteredReportList` | `MAINTENANCE_OFFICER` |
| `/staff/reports/in-progress` | `FilteredReportList` | `MAINTENANCE_OFFICER` |
| `/staff/reports/completed` | `FilteredReportList` | `MAINTENANCE_OFFICER` |
| `/staff/reports/overdue` | `FilteredReportList` | `MAINTENANCE_OFFICER` |
| `/staff/reports/rejected` | `FilteredReportList` | `MAINTENANCE_OFFICER` |
| `/staff/reports/:id` | `StaffReportDetail` inside `StaffLayout` | `MAINTENANCE_OFFICER` |
| `*` | Redirect to `/staff/login` | Public |

Admin routes:

| Route | Component | Protection |
|---|---|---|
| `/` | Redirect to `/admin/login` | Public |
| `/admin/login` | `LoginPage` in admin mode | Public |
| `/admin/overview` | `Overview` inside `AdminLayout` | `ADMIN` |
| `/admin/reports` | `AdminReports` inside `AdminLayout` | `ADMIN` |
| `/admin/reports/:id` | `AdminReportDetail` inside `AdminLayout` | `ADMIN` |
| `/admin/provinces` | `ProvinceMonitoring` inside `AdminLayout` | `ADMIN` |
| `/admin/users` | `Users` inside `AdminLayout` | `ADMIN` |
| `/admin/audit-logs` | `AuditLogs` inside `AdminLayout` | `ADMIN` |
| `/admin/settings` | `Settings` inside `AdminLayout` | `ADMIN` |
| `*` | Redirect to `/admin/login` | Public |

### 3.4 Portal Mode Selection

`src/App.tsx` evaluates:

```ts
const portalMode = (import.meta.env.VITE_PORTAL_MODE || 'citizen').toLowerCase();
```

`PortalRouter` returns:

- `StaffApp` when portal mode is `staff`.
- `AdminApp` when portal mode is `admin`.
- `CitizenApp` by default.

This design allows the same compiled source tree to serve separate product surfaces. It is especially useful when deploying three public entry points:

- Citizen-facing public portal.
- Staff internal portal.
- Admin governance portal.

### 3.5 Context Providers and Authentication State

`src/context/AuthContext.tsx` provides the global authentication context.

State and methods:

| Field or method | Purpose |
|---|---|
| `user` | Current session user. |
| `login(email, password, provincialCouncil?)` | Performs role-sensitive login. |
| `signup(data)` | Creates citizen account and auto-starts session. |
| `logout()` | Clears local storage and session state. |
| `isAuthenticated` | True when a user exists and a token exists. |
| `hasRole(roles)` | Checks role inclusion. |
| `getHomePath(role?)` | Returns role-specific dashboard route. |

Storage keys:

- `rp_user`
- `roadpulse_token`
- `provincialCouncil`
- `rp_remember_email` is used by `Login.tsx` for remember-me behavior.

AuthContext normalizes province strings using `canonicalizeProvince()` from `src/lib/provinceResolver.ts`.

### 3.6 State Management Strategy

The application uses:

- Context API for authentication.
- React state for local component state.
- Derived state through `useMemo`.
- Side effects and polling through `useEffect`.
- Reusable filtering utilities.

Examples:

- `MaintenanceOverview.tsx` loads reports and derives card counts with `useMemo`.
- `LiveMap.tsx` derives visible map markers from search, status, district, priority, and date filters with `useMemo`.
- `FilteredReportList.tsx` stores pagination and filter state locally.
- `ReportWizard.tsx` stores current wizard step, image, coordinates, description, and error messages locally.

The decision not to use Redux is justified because the shared global state is small. Most dashboard state is page-specific and does not need a global store.

### 3.7 Reusable Components

Important reusable components:

| Component | File | Purpose |
|---|---|---|
| `ProtectedRoute` | `src/components/ProtectedRoute.tsx` | Role and portal access protection. |
| `CitizenLayout` | `src/components/CitizenLayout.tsx` | Citizen header, navigation, mobile menu, footer, FAQ. |
| `StaffLayout` | `src/components/StaffLayout.tsx` | Staff sidebar, header, backend status banner. |
| `AdminLayout` | `src/components/AdminLayout.tsx` | Admin command-center sidebar and header. |
| `StatusPill` | `src/components/StatusPill.tsx` | Status label, icon, and color mapping. |
| `ResponsiveDataList` | `src/components/ResponsiveDataList.tsx` | Desktop table and mobile card-list abstraction. |
| `Pagination` | `src/components/Pagination.tsx` | Shared paginated navigation controls. |
| `ActivityTimeline` | `src/components/ActivityTimeline.tsx` | Displays audit log timeline for a record. |
| `EvidenceViewer` | `src/components/EvidenceViewer.tsx` | Full image evidence viewer with zoom, fullscreen, metadata, and bounding box overlay. |
| `AuthInput` | `src/components/AuthInput.tsx` | Authentication input with icon, password visibility toggle, Caps Lock detection, and error display. |
| `Alert` | `src/components/Alert.tsx` | Toast-style feedback alert. |
| `BackendStatusBanner` | `src/components/BackendStatusBanner.tsx` | Polls backend health and displays connection warning. |

### 3.8 Form Handling and Validation Logic

RoadPulse uses controlled React form state.

Citizen login:

- `src/pages/Login.tsx`
- Validates email format.
- Requires password.
- Supports remember-me email persistence.
- Redirects based on intended route and role.

Citizen signup:

- `src/pages/Signup.tsx`
- Two-step form:
  - Step 1: full name and email.
  - Step 2: password and password confirmation.
- Password requirements:
  - Minimum 8 characters.
  - At least one letter.
  - At least one number.
  - At least one special character.
- Prevents citizen registration with emails ending in `@roadpulse.lk`.

Staff login:

- `src/pages/StaffLogin.tsx`
- Requires staff email and password.
- Provides provincial council selector.
- Backend validates the selected province against the stored officer province.

Report wizard:

- `src/pages/citizen/ReportWizard.tsx`
- Validates image type starts with `image/`.
- Validates frontend file size is under 10 MB.
- Displays warning if file size is very small and might be low quality.
- Requires a selected location.
- Requires either road name or description.
- Submits multipart form data to backend.

### 3.9 API Integration Structure

`src/lib/api.ts` exposes domain-specific API groups:

- `reportsApi`
- `potholesApi`
- `authApi`
- `auditLogsApi`
- `settingsApi`

Important functions:

`reportsApi`:

- `list(filters)`
- `getById(id)`
- `getHistory(id)`
- `submit(data)`
- `review(id, action, reason?)`
- `updateStatus(id, status, notes?, priority?)`
- `update(id, updates)`
- `getProvinceStats()`

`potholesApi`:

- Maps report records to `PotholeEvent`.
- Used by legacy inventory and some admin analytics.

`authApi`:

- `login(email, password, provincialCouncil?)`
- `signup(data)`
- `listUsers(filters?)`
- `updateUserStatus(userId, status)`
- `getUserById(userId)`

`auditLogsApi`:

- `list(filters?)`

The normalizer `normalizeReport()` maps backend fields:

| Backend field | Frontend field |
|---|---|
| `citizen_id` | `citizenId` |
| `image_url` | `imageUrl` |
| `latitude` | `lat` |
| `longitude` | `lon` |
| `ai_classification` | `aiClassification` |
| `ai_confidence` | `aiConfidence` |
| `prediction_count` | `predictionCount` |
| `detection_model` | `detectionModel` |
| `detection_timestamp` | `detectionTimestamp` |
| `submitted_at` | `createdAt` |
| `updated_at` | `updatedAt` |
| `last_status_updated_at` | `lastStatusUpdatedAt` |
| `provincial_council` | `provincialCouncil` |
| `maintenance_notes` | `maintenanceNotes` |

### 3.10 Error Handling in the Frontend

Frontend error handling includes:

- Top-level render error boundary in `src/App.tsx`.
- API try/catch in `src/lib/api.ts`.
- Backend health banner in `src/components/BackendStatusBanner.tsx`.
- Loading and error states on pages such as:
  - `MyReports.tsx`
  - `ReportStatus.tsx`
  - `MaintenanceOverview.tsx`
  - `LiveMap.tsx`
  - `FilteredReportList.tsx`
  - `StaffReportDetail.tsx`
  - `AdminReports.tsx`
  - `AuditLogs.tsx`
- Form-level validation errors on authentication and report submission screens.

### 3.11 Protected Routes

Protected routes wrap sensitive pages in `src/App.tsx`.

Example:

```tsx
<ProtectedRoute allowedRoles={['MAINTENANCE_OFFICER']}>
  <StaffLayout><MaintenanceOverview /></StaffLayout>
</ProtectedRoute>
```

Protection logic:

- No user or no token: redirect to portal login.
- Wrong portal role: display portal restriction screen.
- Missing allowed role: redirect to role home path.

### 3.12 Dashboard Rendering Logic

Dashboard rendering follows a consistent pattern:

1. Initialize loading state.
2. Fetch required records through `src/lib/api.ts`.
3. Normalize report data.
4. Apply role or province filters.
5. Derive summary metrics with `useMemo`.
6. Render loading, empty, error, or data state.
7. Provide quick actions and navigation to details.

Examples:

- `MaintenanceOverview.tsx` derives seven cards:
  - Manual Review Required
  - Verified Pothole Reports
  - Scheduled Repairs
  - In Progress Repairs
  - Completed Repairs
  - Overdue Repairs
  - Rejected Reports

- `Overview.tsx` derives admin statistics:
  - Total Telemetry
  - Verified Units
  - Manual Review
  - System Overdue
  - In Operation
  - Completed Ops
  - Rejected Data
  - Field Personnel

### 3.13 Dynamic Filtering Logic

Filtering exists both on the backend and frontend.

Backend filtering:

- `GET /reports` supports:
  - `provincialCouncil`
  - `citizenId`
  - `status`
  - `category`
  - `district`
  - `priority`
  - `search`
  - pagination

Frontend filtering:

- `src/lib/staffReportFilters.ts` provides report status predicates.
- `src/lib/provinceResolver.ts` normalizes province and district names.
- `LiveMap.tsx` filters by:
  - district
  - status
  - priority
  - date range
  - search term
- `MyReports.tsx` filters by friendly citizen lifecycle labels.
- `AuditLogs.tsx` supports backend action/search filters; role/province selectors are visibly disabled because backend does not currently support those filters.

### 3.14 Map Rendering Logic

Map features appear in:

- `src/pages/citizen/ReportWizard.tsx`
- `src/pages/LiveMap.tsx`
- `src/pages/ReviewQueue.tsx` legacy page

Citizen map:

- Uses `MapContainer`, `TileLayer`, `Marker`, `useMap`, and `useMapEvents`.
- Browser geolocation is requested through `navigator.geolocation.getCurrentPosition`.
- User can manually click the map to set lat/lon.
- Coordinates are stored in local React state.

Staff live map:

- Uses Leaflet, React Leaflet, and `react-leaflet-cluster`.
- Centers map on officer province through `getProvinceCenter()`.
- Shows only active operational statuses:
  - `Verified`
  - `Scheduled`
  - `In Progress`
- Uses custom `L.divIcon` markers:
  - Green for verified
  - Orange for scheduled
  - Blue for in progress
- Uses `MarkerClusterGroup` to reduce visual clutter.
- Clicking a marker opens inspection details and quick status transitions.

### 3.15 Responsive Design Implementation

The frontend relies heavily on Tailwind CSS breakpoints:

- `sm:`
- `md:`
- `lg:`
- `xl:`

Responsive examples:

- `CitizenLayout` uses desktop navigation and a full-screen mobile menu.
- `StaffLayout` and `AdminLayout` use fixed desktop sidebars and mobile overlays.
- `ResponsiveDataList` renders a table on desktop and card list on mobile.
- `ReportWizard` is optimized for a mobile capture workflow with a bottom-safe layout and full-screen map modal.
- `LiveMap` has a desktop side filter panel and mobile filter drawer.

### 3.16 Tailwind Usage

Global Tailwind configuration:

- `tailwind.config.js` defines semantic CSS variable colors:
  - `primary`
  - `accent`
  - `border`
  - `bg`
  - `text`
  - `muted`

Global component classes in `src/index.css`:

- `.card-premium`
- `.glass-effect`
- `.section-heading`
- `.btn-premium`
- `.badge-premium`
- `.hover-lift`
- `.status-pill`
- `.table-premium`
- status color helpers

This creates a consistent design language across dashboards while preserving Tailwind's flexibility.

### 3.17 UI/UX Patterns

The UI uses:

- Role-specific layouts.
- Sidebar navigation for internal dashboards.
- Sticky headers for staff/admin consoles.
- Card-based metric summaries.
- Tables for dense administrative data.
- Map-first workflows for geographic records.
- Progress steps for citizen report submission.
- Status pills for lifecycle readability.
- Clear empty, loading, and error states.
- Citizen photo guidance with correct/incorrect image examples.

### 3.18 Citizen Portal Analysis

#### CitizenHome - `src/pages/citizen/CitizenHome.tsx`

Purpose:

- Public landing page for citizens.
- Explains the value of RoadPulse.
- Provides CTAs to submit a report or view activity.

Functionality:

- Links to `/citizen/report`.
- Links to `/citizen/my-reports`.
- Displays feature cards and safety guidance.

Connected APIs:

- None directly.

Design logic:

- Public education first, workflow CTAs second.
- Safety reminder discourages unsafe reporting while driving.

#### ReportWizard - `src/pages/citizen/ReportWizard.tsx`

Purpose:

- Primary citizen report creation workflow.

Steps:

- `PHOTO`
- `LOCATION`
- `DETAILS`
- `REVIEW`
- `AUTH`
- `SUBMITTING`
- `SUCCESS`

Note: the route is already protected by `ProtectedRoute`, so the `AUTH` step is mostly defensive or legacy within the active route tree.

Internal logic:

- Uses a file input with `accept="image/*"` and `capture="environment"` for mobile camera capture.
- Validates image type and size.
- Generates compressed data URL preview through canvas.
- Uses Leaflet map modal for manual pinning.
- Uses browser geolocation for current location.
- Requires location and description/landmark.
- Submits `FormData` to `reportsApi.submit`.
- Redirects to `/citizen/status/{report.id}` after successful submission.

Connected API:

- `POST /reports` through `reportsApi.submit`.

Backend security:

- Backend ignores user-supplied identity and uses authenticated `current_user.id`.

#### MyReports - `src/pages/citizen/MyReports.tsx`

Purpose:

- Lists the authenticated citizen's report history.

Logic:

- Calls `reportsApi.list({ citizenId: user.id, limit: 100 })`.
- Backend further enforces citizen ownership using current JWT user.
- Sorts by newest first.
- Polls every 30 seconds.
- Allows filtering by citizen-friendly labels:
  - Under Review
  - Verified
  - Repair Scheduled
  - Repair In Progress
  - Fixed
  - Not Accepted

Connected API:

- `GET /reports`

#### ReportStatus - `src/pages/citizen/ReportStatus.tsx`

Purpose:

- Displays lifecycle progress for one report.

Logic:

- Reads `id` from route params.
- Calls `reportsApi.getById(id)`.
- Builds a timeline based on canonical status:
  - Submitted
  - Under Review
  - Verified
  - Scheduled
  - In Progress
  - Fixed
- Handles rejection with a shorter rejection-specific timeline.

Connected API:

- `GET /reports/{report_id}`

Security behavior:

- The frontend route itself is not wrapped in `ProtectedRoute`.
- Backend requires authentication through `get_current_user`.
- A citizen can only retrieve the report if they own it.

### 3.19 Authentication Pages Analysis

#### LoginPage - `src/pages/Login.tsx`

Purpose:

- Shared login page for citizen and admin portal modes.

Logic:

- Reads intended return path from router state or `returnTo` query.
- Validates email and password.
- Calls `AuthContext.login`.
- Redirects based on authenticated role and portal mode.
- Supports remember-me email persistence.

Connected API:

- `POST /auth/login`

#### Signup - `src/pages/Signup.tsx`

Purpose:

- Citizen registration workflow.

Logic:

- Two-step onboarding.
- Validates identity data and password strength.
- Calls `AuthContext.signup`.
- Auto-starts session if backend returns token and user.

Connected API:

- `POST /auth/signup`

Current limitation:

- The frontend blocks emails ending in `@roadpulse.lk`, but seeded staff accounts use `@roadpulse.gov.lk`. The rule should be expanded if reserved staff domains must be blocked comprehensively.

#### StaffLogin - `src/pages/StaffLogin.tsx`

Purpose:

- Dedicated staff portal authentication page.

Logic:

- Requires selected provincial council.
- Calls `AuthContext.login(email, password, province)`.
- Backend validates the selected province against the officer's stored province.
- Redirects to staff overview after success.

Connected API:

- `POST /auth/login`

### 3.20 Staff Dashboard Analysis

#### MaintenanceOverview - `src/pages/MaintenanceOverview.tsx`

Purpose:

- Province-scoped summary for a maintenance officer.

Logic:

- Reads officer province from `AuthContext`.
- Validates province using `hasOfficerProvince()`.
- Calls `reportsApi.list({ provincialCouncil: province, limit: 1000 })`.
- Applies `filterReportsForProvince`.
- Uses predicates from `staffReportFilters.ts` to compute card counts.
- Polls every 30 seconds.
- Cards navigate to filtered report lists.

Connected API:

- `GET /reports`

#### FilteredReportList - `src/pages/FilteredReportList.tsx`

Purpose:

- Displays staff report queues by category.

Categories:

- `verified`
- `manual-review`
- `scheduled`
- `in-progress`
- `completed`
- `overdue`
- `rejected`
- `all`

Logic:

- Reads category from route.
- Calls `reportsApi.list` with `category`, `page`, `limit`, `search`, and `provincialCouncil`.
- Renders paginated cards.
- Provides quick actions:
  - Manual review: verify or reject.
  - Verified: schedule.
  - In progress: complete.
  - Rejected: restore to verified.
- Exports current page reports to CSV using PapaParse.

Connected APIs:

- `GET /reports`
- `PATCH /reports/{id}/status`

#### StaffReportDetail - `src/pages/StaffReportDetail.tsx`

Purpose:

- Detailed staff management view for one report.

Logic:

- Loads report by ID.
- Performs local province access check after backend check.
- Shows evidence image.
- Shows metadata: date, time, coordinates, citizen ID, province, district.
- Shows AI analysis:
  - classification
  - confidence
  - model
- Provides lifecycle actions:
  - `New` -> `Verified` or `Rejected`
  - `Verified` -> `Scheduled` or `Rejected`
  - `Scheduled` -> `In Progress`
  - `In Progress` -> `Completed`
- Allows priority and maintenance notes editing.

Connected APIs:

- `GET /reports/{id}`
- `PATCH /reports/{id}`
- `PATCH /reports/{id}/status`

#### LiveMap - `src/pages/LiveMap.tsx`

Purpose:

- Geospatial maintenance operations view.

Logic:

- Loads all province reports.
- Filters to active map statuses:
  - `Verified`
  - `Scheduled`
  - `In Progress`
- Provides filters for district, status, priority, date range, and search.
- Uses marker clustering.
- Opens a detail drawer when marker is selected.
- Allows status progression directly from the map.

Connected APIs:

- `GET /reports`
- `PATCH /reports/{id}/status`

#### ReportMaintenanceHistory - `src/pages/ReportMaintenanceHistory.tsx`

Purpose:

- Historical lifecycle table for provincial maintenance records.

Logic:

- Fetches reports and audit logs in parallel.
- Filters reports by officer province.
- Joins audit entries by `entityId === report.id`.
- Constructs lifecycle dates for submitted, verified, in-progress, and completed.
- Supports district, status, priority, and search filters.

Connected APIs:

- `GET /reports`
- `GET /reports/history`

### 3.21 Admin Dashboard Analysis

#### Overview - `src/pages/Overview.tsx`

Purpose:

- Global executive dashboard.

Logic:

- Fetches reports, pothole events, users, audit logs, and province stats in parallel.
- Polls every 30 seconds.
- Computes global statistics.
- Displays attention-required reports.
- Displays top province activity.
- Displays recent audit activity.

Connected APIs:

- `GET /reports`
- `GET /auth/users`
- `GET /reports/history`
- `GET /reports/stats/provinces`

#### AdminReports - `src/pages/AdminReports.tsx`

Purpose:

- Global report stream and governance table.

Logic:

- Uses backend pagination.
- Filters by search, province, district, and status.
- Navigates to admin report detail page.
- Displays status, jurisdiction, district, coordinates, date, and priority.

Connected API:

- `GET /reports`

#### AdminReportDetail - `src/pages/AdminReportDetail.tsx`

Purpose:

- Administrative inspection and override view.

Logic:

- Loads report and report-specific history in parallel.
- Allows admin to edit:
  - provincial council
  - district
  - status
  - priority
  - maintenance notes
- Saves through generic report update endpoint.
- Reloads audit history after save.

Connected APIs:

- `GET /reports/{id}`
- `GET /reports/{id}/history`
- `PATCH /reports/{id}`

#### ProvinceMonitoring - `src/pages/ProvinceMonitoring.tsx`

Purpose:

- Province-level performance analytics.

Logic:

- Fetches reports and pothole events.
- Derives per-province statistics.
- Uses `resolveProvince()` fallback if records lack province.
- Renders charts using Recharts.
- Shows totals, in-progress, completed, awaiting, overdue, and completion rate.

Connected APIs:

- `GET /reports`

#### Users - `src/pages/Users.tsx`

Purpose:

- Administrator user directory and account control.

Logic:

- Fetches paginated users.
- Supports UI filters for search, role, and province.
- Toggles account status between `ACTIVE` and `DEACTIVATED`.
- Disables deactivate action for admins.

Connected APIs:

- `GET /auth/users`
- `PATCH /auth/users/{user_id}`

Current mismatch:

- The frontend sends `search`, `role`, and `provincialCouncil` query params, but backend `GET /auth/users` currently applies only pagination and ordering.

#### AuditLogs - `src/pages/AuditLogs.tsx`

Purpose:

- Central audit trail view.

Logic:

- Fetches paginated audit logs.
- Supports action and search filters.
- Role and province filters are disabled in the UI because backend does not currently implement them.

Connected API:

- `GET /reports/history`

#### Settings - `src/pages/Settings.tsx`

Purpose:

- Administrative system diagnostics and configuration display.

Logic:

- Calls `checkBackendHealth()` to test database connectivity through `/debug/db`.
- Saves administrative notes to `localStorage`.
- Displays hardcoded routing protocol and threshold information.

Connected API:

- `GET /debug/db`

### 3.22 Legacy or Unwired Frontend Pages

The following files exist but are not currently mounted in the active route trees of `src/App.tsx`:

| File | Description |
|---|---|
| `src/pages/ReviewQueue.tsx` | Legacy/alternate staff review queue with AI-verified, manual review, and rejected tabs. |
| `src/pages/Repairs.tsx` | Legacy repair operations board using `potholesApi`. |
| `src/pages/PotholesTable.tsx` | Legacy pothole inventory table using `potholesApi`. |
| `src/pages/PotholeDetail.tsx` | Legacy pothole detail page using `potholesApi` and report evidence. |
| `src/pages/Admin.tsx` | Older admin page combining user management and audit logs. |
| `src/pages/Offline.tsx` | Offline page, not currently routed. |

These pages are still useful as implementation references, but dissertation documentation should distinguish them from the active production route tree.

---

## Section 4 - Backend System Analysis

### 4.1 Backend Folder Structure

```text
backend/
  README.md
  requirements.txt
  seed_db.py
  seed_users.py
  fix_provinces.py
  check_db.py
  reset_test_user.py
  uploads/
  app/
    main.py
    config.py
    database.py
    models.py
    schemas.py
    crud.py
    security.py
    init_db.py
    routers/
      auth.py
      reports.py
      ai.py
    services/
      roboflow_service.py
      province_resolver.py
      ai_service.py
```

### 4.2 Backend Application Entry Point

`backend/app/main.py` creates the FastAPI application.

Responsibilities:

- Configure logging.
- Create database tables through SQLAlchemy metadata.
- Create `FastAPI(title="RoadPulse Backend API", version="1.0.0")`.
- Configure CORS.
- Mount static upload files.
- Include routers:
  - `auth.router`
  - `reports.router`
  - `ai.router`
- Expose health/debug endpoints.

Important mounted static path:

```py
app.mount("/static", StaticFiles(directory="uploads"), name="static")
```

This makes uploaded files accessible as:

```text
{BACKEND_PUBLIC_URL}/static/{filename}
```

### 4.3 API Router Architecture

Routers:

| Router file | Prefix | Domain |
|---|---|---|
| `backend/app/routers/auth.py` | `/auth` | Login, signup, user administration. |
| `backend/app/routers/reports.py` | `/reports` | Report creation, listing, status updates, histories, province stats. |
| `backend/app/routers/ai.py` | `/api/ai` | Direct AI image analysis. |

This separation is appropriate because authentication, reports, and AI are separate bounded contexts.

### 4.4 Authentication Middleware and Dependencies

Authentication is implemented with FastAPI dependencies rather than custom middleware.

Core functions in `backend/app/security.py`:

- `verify_password(plain_password, hashed_password)`
- `get_password_hash(password)`
- `create_access_token(data, expires_delta=None)`
- `get_current_user(token, db)`
- `require_admin(current_user)`
- `require_staff(current_user)`
- `require_citizen(current_user)`

`OAuth2PasswordBearer(tokenUrl="auth/login")` extracts bearer tokens from the `Authorization` header.

### 4.5 JWT Implementation

`create_access_token()`:

- Copies input data.
- Adds expiration claim `exp`.
- Encodes using `jwt.encode`.
- Uses `settings.SECRET_KEY`.
- Uses algorithm `HS256`.

`get_current_user()`:

- Decodes token using same secret and algorithm.
- Reads email from `sub`.
- Queries `users` table by email.
- Raises `401` if token is missing, invalid, expired, or user no longer exists.

### 4.6 User Management Logic

User persistence is defined in:

- `backend/app/models.py` - `User`
- `backend/app/schemas.py` - `UserCreate`, `UserRead`, `UserUpdate`
- `backend/app/routers/auth.py`
- `backend/app/crud.py`

User creation:

- Normalizes email to lowercase.
- Hashes password using bcrypt.
- Stores role and optional provincial council.

User update:

- Admin can patch:
  - `name`
  - `role`
  - `provincial_council`
  - `account_status`

Login:

- Normalizes email.
- Uses case-insensitive fallback.
- Checks password.
- Checks staff selected province.
- Checks account status.
- Returns JWT and user object.

### 4.7 Report Management Logic

Report management is centered in `backend/app/routers/reports.py`.

Report creation:

- Requires citizen role.
- Accepts multipart form data.
- Saves image.
- Calls AI inference.
- Resolves province/district.
- Creates `CitizenReport`.
- Stores detection result.
- Stores audit log.

Report listing:

- Requires any authenticated user.
- Applies role-specific filtering:
  - Admin: global, optionally province-filtered.
  - Staff: only assigned province.
  - Citizen: only own reports.
- Applies category, status, district, priority, search, and pagination.

Report update:

- Staff/admin can update status, priority, notes.
- Staff cannot update reports outside their province.
- Admin can update global report metadata.

### 4.8 Province Assignment Logic

Backend province logic is in `backend/app/services/province_resolver.py`.

It defines:

- `PROVINCE_DISTRICTS`
- `PROVINCE_BOUNDARIES`
- `resolve_province_and_district(lat, lon)`

The resolver checks latitude/longitude against approximate bounding boxes. If a coordinate falls inside a province bounding box, that province is selected. The district is currently assigned as the first district in that province's district list.

Example:

- Western Provincial Council districts:
  - Colombo
  - Gampaha
  - Kalutara

Current limitation:

- District assignment is approximate and not true reverse geocoding.
- Overlapping or edge-boundary coordinates may be assigned according to the first matching boundary.
- A production system should use GIS polygons or a reverse geocoding service.

### 4.9 District Filtering Logic

Backend district filtering:

```py
if district and district not in ['null', 'undefined', 'All']:
    query = query.filter(models.CitizenReport.district == district)
```

Frontend district normalization:

- Implemented in `src/lib/provinceResolver.ts`.
- `normalizeDistrict()` strips extra text such as `District`, punctuation, and casing differences.

This means the frontend is more forgiving than the backend. For better reliability, district values should be canonicalized before storage or normalized at query time.

### 4.10 Status Update Logic

Status normalization in backend:

- `VALID_REPORT_STATUSES`
- `STATUS_ALIASES`
- `normalize_report_status(value)`

Canonical statuses:

- `New`
- `Verified`
- `Scheduled`
- `In Progress`
- `Completed`
- `Rejected`

Aliases include:

- `pending` -> `New`
- `confirmed` -> `Verified`
- `fixed` -> `Completed`
- `discarded` -> `Rejected`
- `unable to repair` -> `Rejected`

Status update endpoint:

- `PATCH /reports/{report_id}/status`
- Requires staff/admin.
- Checks province if maintenance officer.
- Updates report status, priority, notes.
- Creates audit log.
- Creates status update record.

### 4.11 AI Integration Endpoints

AI is used in two ways:

1. Report creation endpoint:
   - `POST /reports`
   - Calls `analyze_pothole_image()` during report submission.

2. Direct AI endpoint:
   - `POST /api/ai/analyze`
   - Requires staff/admin through `require_staff`.
   - Saves temporary upload.
   - Calls Roboflow service.
   - Deletes temporary file.

Implementation issue:

- `backend/app/routers/ai.py` calls `analyze_pothole_image(file_path)` without `await`, but `analyze_pothole_image` in `roboflow_service.py` is asynchronous.
- As written, `result` becomes a coroutine object, and `result.get(...)` would fail.
- Correct implementation should use:

```py
result = await analyze_pothole_image(file_path)
```

The report creation route correctly uses `await analyze_pothole_image(file_path)`.

### 4.12 Database Transaction Handling

CRUD functions in `backend/app/crud.py` generally:

1. Create or mutate SQLAlchemy model object.
2. `db.add(...)` when needed.
3. `db.commit()`.
4. `db.refresh(...)`.
5. Return ORM instance.

This is simple and clear, but it means multi-step operations may commit several times.

Example in `POST /reports`:

- `crud.create_report()` commits report.
- `crud.create_detection_result()` commits detection.
- `crud.create_audit_log()` commits audit.

The detection and audit persistence are intentionally non-blocking. If they fail, the report can still be created.

Production improvement:

- Use a single transaction for required database writes.
- Use explicit nested handling only for optional writes.
- Avoid partial inconsistency between reports and detection/audit records.

### 4.13 Error Handling

Backend error handling includes:

- `HTTPException` for expected 400/401/403/404 cases.
- Try/catch around report creation.
- `db.rollback()` on critical report creation failure.
- Non-fatal logging for AI, detection result persistence, and audit log persistence.

Examples:

- Invalid login: `401 Invalid credentials`.
- Deactivated account: `403 Account deactivated`.
- Province mismatch for staff login: `401 Selected province does not match assigned officer account`.
- Report not found: `404 Report not found`.
- Unauthorized staff province access: `403 Access Restricted`.
- Unsupported report status: `400 Unsupported report status`.

### 4.14 Security Handling

Implemented security:

- Bcrypt password hashing.
- JWT bearer tokens.
- Role-based dependencies.
- Staff province checks on report access/update.
- Citizen ownership check on `GET /reports/{report_id}`.
- Admin-only user management and province stats.
- Generated upload filenames reduce path traversal risk.

Current security concerns:

- CORS allows all origins in `backend/app/main.py`.
- Tokens are stored in `localStorage`, increasing impact of XSS.
- `.env` exists locally and `.gitignore` does not currently ignore `.env`.
- Public staff verification endpoint can reveal whether an email belongs to staff/admin.
- Public check-email endpoint enables account enumeration.
- Upload endpoint lacks server-side image type and size validation.
- Static uploaded images are publicly accessible if the URL is known.
- `GET /reports/{report_id}/history` checks staff province but does not check citizen ownership for citizen users.
- `PATCH /reports/{report_id}/notes` and `/priority` should handle missing reports before reading `report.provincial_council`.

### 4.15 API Response Structure

Paginated response structure is defined in `backend/app/schemas.py`:

```py
class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    page: int
    limit: int
    total_pages: int
```

Used by:

- `PaginatedReportResponse`
- `PaginatedUserResponse`
- `PaginatedAuditLogResponse`

Frontend type equivalent:

- `PaginatedResponse<T>` in `src/types.ts`

### 4.16 Endpoint Reference

#### Root and debug endpoints

| Method | Route | Security | Purpose |
|---|---|---|---|
| GET | `/` | Public | Basic welcome response. |
| GET | `/api/health` | Public | Basic backend health check. |
| GET | `/debug/db` | Public | Database connectivity check. |
| GET | `/debug/reports` | Admin | Report count and latest reports diagnostic. |

#### Authentication endpoints

| Method | Route | Request | Response | Security | Business logic |
|---|---|---|---|---|---|
| POST | `/auth/login` | JSON `email`, `password`, optional `provincial_council` | JWT token and user object | Public | Normalizes email, verifies password, validates province for maintenance officers, blocks deactivated users. |
| POST | `/auth/signup` | `UserCreate` JSON | JWT token and user object | Public | Checks duplicate email, hashes password, creates user, auto-logins. |
| GET | `/auth/staff/verify?email=...` | Query email | Staff/admin user summary | Public | Confirms whether a user is staff/admin. Used by frontend compatibility API but not central active login flow. |
| GET | `/auth/check-email?email=...` | Query email | `{ exists: boolean }` | Public | Checks if email exists. |
| GET | `/auth/users?page&limit` | Query pagination | `PaginatedUserResponse` | Admin | Lists users newest first. Current backend ignores search/role/province filters sent by frontend. |
| GET | `/auth/users/{user_id}` | Path user ID | `UserRead` | Admin | Returns one user by ID. |
| PATCH | `/auth/users/{user_id}` | `UserUpdate` JSON | `UserRead` | Admin | Updates user fields. |

#### Report endpoints

| Method | Route | Request | Response | Security | Business logic |
|---|---|---|---|---|---|
| POST | `/reports` | Multipart `latitude`, `longitude`, optional `description`, optional `address`, required `image` | `CitizenReportRead` | Citizen | Saves image, runs AI inference, resolves province/district, creates report, detection result, audit log. |
| GET | `/reports` | Query filters and pagination | `PaginatedReportResponse` | Authenticated | Lists reports with role-aware filtering and optional category/status/district/priority/search filters. |
| GET | `/reports/stats/provinces` | None | List of province/count pairs | Admin | Counts reports grouped by `provincial_council`. |
| GET | `/reports/history` | Query `page`, `limit`, optional `action`, `search` | `PaginatedAuditLogResponse` | Staff/Admin | Lists audit logs; staff logs are restricted by joined report province. |
| GET | `/reports/{report_id}/history` | Path report ID | List of `AuditLogRead` | Authenticated | Lists audit logs for one report; staff province checked. Citizen ownership should be strengthened. |
| GET | `/reports/{report_id}` | Path report ID | `CitizenReportRead` | Authenticated | Retrieves one report with role and ownership checks. |
| PATCH | `/reports/{report_id}/status` | `StatusUpdateCreate` JSON | `CitizenReportRead` | Staff/Admin | Updates status, priority, notes; writes audit and status update. |
| PATCH | `/reports/{report_id}/notes?notes=...` | Query notes | `CitizenReportRead` | Staff/Admin | Updates maintenance notes. |
| PATCH | `/reports/{report_id}/priority?priority=...` | Query priority | `CitizenReportRead` | Staff/Admin | Updates report priority. |
| PATCH | `/reports/{report_id}` | Generic JSON dict | `CitizenReportRead` | Staff/Admin | Updates mapped fields: province, district, status, priority, maintenance notes. Writes audit for major changes. |

#### AI endpoints

| Method | Route | Request | Response | Security | Business logic |
|---|---|---|---|---|---|
| POST | `/api/ai/analyze` | Multipart image | `DetectionResult` | Staff/Admin | Direct image analysis endpoint. Current implementation must `await` async Roboflow service. |

---

## Section 5 - Database System Analysis

### 5.1 Database Architecture

The intended database is PostgreSQL. The database is accessed through SQLAlchemy ORM models in `backend/app/models.py`.

Active tables:

- `users`
- `citizen_reports`
- `detection_results`
- `audit_logs`
- `status_updates`

The user request mentions tables such as `reports`, `report_status`, and `uploaded_images`. In the actual implementation:

- The main report table is named `citizen_reports`, not `reports`.
- Report status is stored directly as `citizen_reports.status`.
- Status history is stored in `status_updates`.
- Uploaded image metadata is stored as `citizen_reports.image_url`.
- There is no separate `uploaded_images` table.
- AI result storage is implemented by `detection_results` plus AI columns on `citizen_reports`.

### 5.2 Table: users

Model: `backend/app/models.py` - `User`

Table name: `users`

Columns:

| Column | Type | Constraints / purpose |
|---|---|---|
| `id` | String | Primary key. Generated as `usr-{8 hex chars}`. |
| `name` | String | Required display name. |
| `email` | String | Required, unique, indexed. Login identity. |
| `password_hash` | String | Required bcrypt password hash. |
| `role` | String | Required role: `CITIZEN`, `MAINTENANCE_OFFICER`, `ADMIN`. |
| `provincial_council` | String nullable | Assigned province for maintenance officers. |
| `account_status` | String | Defaults to `ACTIVE`. Can become `DEACTIVATED`. |
| `created_at` | DateTime timezone | Defaults to database current time. |
| `updated_at` | DateTime timezone | Updated on modification. |

Relationships:

- `reports` -> `CitizenReport`
- `audit_logs` -> `AuditLog`
- `status_updates` -> `StatusUpdate`

Design rationale:

- Email uniqueness supports reliable login.
- Role and province are stored on the user to support jurisdictional access.
- Account status allows soft-deactivation without deleting historical audit references.

### 5.3 Table: citizen_reports

Model: `CitizenReport`

Table name: `citizen_reports`

Columns:

| Column | Type | Constraints / purpose |
|---|---|---|
| `id` | String | Primary key. Generated as `rep-{8 hex chars}`. |
| `citizen_id` | String | Foreign key to `users.id`, required. |
| `image_url` | String | Required URL to uploaded evidence image. |
| `description` | String nullable | Citizen text description. |
| `latitude` | Float | Required report latitude. |
| `longitude` | Float | Required report longitude. |
| `address` | String nullable | Optional address text. |
| `district` | String nullable | District assigned by resolver/admin. |
| `provincial_council` | String nullable | Province assigned by resolver/admin. |
| `status` | String | Defaults to `New`. Lifecycle status. |
| `priority` | String nullable | Low, Medium, High, Urgent. |
| `ai_classification` | String nullable | `VERIFIED_POTHOLE`, `NEEDS_MANUAL_REVIEW`, `REJECTED`. |
| `ai_confidence` | Float nullable | Highest detection confidence. |
| `prediction_count` | Integer | Defaults to 0. |
| `bbox` | JSON nullable | Normalized bounding box. |
| `detection_model` | String nullable | Roboflow model ID. |
| `detection_timestamp` | DateTime timezone nullable | Time of detection. |
| `maintenance_notes` | String nullable | Staff/admin notes. |
| `submitted_at` | DateTime timezone | Defaults to database current time. |
| `last_status_updated_at` | DateTime timezone nullable | Status update timestamp. |
| `updated_at` | DateTime timezone nullable | Auto-updated timestamp. |

Relationships:

- `citizen` -> `User`
- `detection_results` -> `DetectionResult`
- `audit_logs` -> `AuditLog`
- `status_updates` -> `StatusUpdate`

Design rationale:

- Report table stores the authoritative report lifecycle state.
- AI metadata is denormalized into the report for fast dashboard reads.
- Full raw AI response is stored separately in `detection_results`.
- Status history and audit history are separate append-only related records.

### 5.4 Table: detection_results

Model: `DetectionResult`

Table name: `detection_results`

Columns:

| Column | Type | Constraints / purpose |
|---|---|---|
| `id` | String | Primary key. Generated as `det-{8 hex chars}`. |
| `report_id` | String | Foreign key to `citizen_reports.id`, required. |
| `detected` | Boolean | Whether any pothole-like prediction was detected. |
| `confidence` | Float nullable | Best prediction confidence. |
| `classification` | String nullable | RoadPulse AI classification. |
| `prediction_count` | Integer | Number of predictions. |
| `bbox` | JSON nullable | Bounding box. |
| `raw_response` | JSON nullable | Raw Roboflow response. |
| `model_id` | String nullable | Model ID. |
| `created_at` | DateTime timezone | Defaults to current time. |

Relationship:

- `report` -> `CitizenReport`

Design rationale:

- Keeps full AI result details separate from operational report state.
- Allows future support for multiple detections per report or multiple model runs.
- Preserves raw response for debugging and academic evaluation.

### 5.5 Table: audit_logs

Model: `AuditLog`

Table name: `audit_logs`

Columns:

| Column | Type | Constraints / purpose |
|---|---|---|
| `id` | String | Primary key. Generated as `aud-{8 hex chars}`. |
| `report_id` | String nullable | Foreign key to `citizen_reports.id`. |
| `user_id` | String | Foreign key to `users.id`, required. |
| `action` | String | Action label. |
| `old_status` | String nullable | Prior status. |
| `new_status` | String nullable | New status. |
| `notes` | String nullable | Audit explanation. |
| `created_at` | DateTime timezone | Defaults to current time. |

Relationships:

- `report` -> `CitizenReport`
- `user` -> `User`

Design rationale:

- Provides accountability for report submissions, status changes, and administrative changes.
- Maintains historical evidence of workflow decisions.

Current mismatch:

- Frontend `AuditLog` type includes `actor`, `actorName`, `province`, and `entityType`, but backend returns only the database fields above. `src/lib/api.ts` maps backend logs into frontend shape, using `user_id` as `actorName`.

### 5.6 Table: status_updates

Model: `StatusUpdate`

Table name: `status_updates`

Columns:

| Column | Type | Constraints / purpose |
|---|---|---|
| `id` | String | Primary key. Generated as `upd-{8 hex chars}`. |
| `report_id` | String | Foreign key to `citizen_reports.id`, required. |
| `officer_id` | String | Foreign key to `users.id`, required. |
| `status` | String | Status at the time of update. |
| `priority` | String nullable | Priority at update time. |
| `notes` | String nullable | Officer notes. |
| `created_at` | DateTime timezone | Defaults to current time. |

Relationships:

- `report` -> `CitizenReport`
- `officer` -> `User`

Design rationale:

- Provides structured maintenance history separate from general audit logs.
- Allows future analytics on repair timelines and officer actions.

### 5.7 Relationships

Relational model:

```text
users
  1 -> many citizen_reports
  1 -> many audit_logs
  1 -> many status_updates

citizen_reports
  many -> 1 users
  1 -> many detection_results
  1 -> many audit_logs
  1 -> many status_updates

detection_results
  many -> 1 citizen_reports

audit_logs
  many -> 1 citizen_reports
  many -> 1 users

status_updates
  many -> 1 citizen_reports
  many -> 1 users
```

### 5.8 Data Flow

Report data flow:

1. User exists in `users`.
2. Citizen submits report.
3. `citizen_reports` row is created.
4. `detection_results` row records AI output.
5. `audit_logs` row records submission.
6. Staff actions update `citizen_reports.status`.
7. Staff actions append `status_updates`.
8. Staff/admin actions append `audit_logs`.
9. Dashboards query `citizen_reports` and `audit_logs`.

### 5.9 Query Behavior

Important query patterns:

- Login by `users.email`.
- List reports ordered by `citizen_reports.submitted_at.desc()`.
- Staff reports filtered by `citizen_reports.provincial_council`.
- Citizen reports filtered by `citizen_reports.citizen_id`.
- Category filters based on `status`, `ai_classification`, and `submitted_at`.
- Audit logs ordered by `audit_logs.created_at.desc()`.
- Staff audit logs join `AuditLog` to `CitizenReport` for province filtering.
- Province stats group by `citizen_reports.provincial_council`.

### 5.10 Normalization Analysis

The schema is partially normalized:

Strong normalization:

- Users are separate from reports.
- Detection results are separate from reports.
- Audit logs are separate from report state.
- Status updates are separate from report state.

Intentional denormalization:

- `CitizenReport` stores AI summary fields (`ai_classification`, `ai_confidence`, `prediction_count`, `bbox`) for fast dashboard access.
- `CitizenReport` stores province/district strings rather than a separate province table.
- `CitizenReport.status` stores current state directly rather than deriving it from the latest `status_updates` row.

This is appropriate for a prototype dashboard because it simplifies reads and UI rendering. For a production system, normalized lookup tables for provinces, districts, statuses, and roles could improve consistency.

### 5.11 Why PostgreSQL Was Selected

PostgreSQL is appropriate because:

- It is reliable and widely used for transactional systems.
- It supports relational integrity with primary and foreign keys.
- It supports JSON columns for AI bounding boxes and raw inference responses.
- It can scale to larger datasets with indexes and partitioning.
- It can later support PostGIS for true geospatial queries.
- It integrates cleanly with SQLAlchemy.

### 5.12 Indexing Strategy

Existing explicit index:

- `users.email` has `index=True` and `unique=True`.

Recommended indexes:

- `citizen_reports.citizen_id`
- `citizen_reports.provincial_council`
- `citizen_reports.status`
- `citizen_reports.district`
- `citizen_reports.priority`
- `citizen_reports.submitted_at`
- Composite index: `(provincial_council, status)`
- Composite index: `(provincial_council, district)`
- `audit_logs.report_id`
- `audit_logs.user_id`
- `audit_logs.created_at`
- `status_updates.report_id`
- `detection_results.report_id`

Future GIS:

- Add `geometry(Point, 4326)` or generated point column with PostGIS index.
- Replace bounding-box province resolver with polygon containment queries.

---

## Section 6 - Authentication and Security

### 6.1 JWT Authentication Workflow

Login lifecycle:

1. User submits credentials.
2. Frontend calls `POST /auth/login`.
3. Backend normalizes email.
4. Backend retrieves user from database.
5. Backend verifies password with bcrypt.
6. Backend checks role-specific constraints.
7. Backend blocks deactivated accounts.
8. Backend creates JWT with `sub`, `role`, and `exp`.
9. Frontend stores token as `roadpulse_token`.
10. Frontend stores user as `rp_user`.
11. Future API calls send `Authorization: Bearer {token}`.

Token validation:

1. FastAPI `OAuth2PasswordBearer` extracts the token.
2. `get_current_user()` decodes JWT.
3. Email is read from `sub`.
4. User is loaded from database.
5. Request continues only if user exists and token is valid.

### 6.2 Signup Lifecycle

Citizen signup:

1. User completes two-step signup form.
2. Frontend validates name, email, password, confirmation.
3. Frontend calls `AuthContext.signup`.
4. `AuthContext.signup` calls `authApi.signup`.
5. Backend checks duplicate email.
6. Backend hashes password.
7. Backend creates user with role `CITIZEN`.
8. Backend returns JWT and user object.
9. Frontend persists session and redirects.

### 6.3 Session Persistence

Frontend stores:

- `rp_user`: serialized user.
- `roadpulse_token`: JWT.
- `provincialCouncil`: officer province where applicable.

Pros:

- Simple persistence across page reloads.
- No backend session store required.

Cons:

- Tokens in `localStorage` are accessible to injected JavaScript.
- No refresh token rotation.
- No server-side token revocation mechanism.

Recommended production improvement:

- Use secure, HTTP-only, SameSite cookies or a hardened token strategy.
- Add refresh tokens and revocation.
- Add session expiry handling in the UI.

### 6.4 Role-Based Authorization

Backend functions:

- `require_admin`: only `ADMIN`.
- `require_staff`: `ADMIN` or `MAINTENANCE_OFFICER`.
- `require_citizen`: only `CITIZEN`.

Access rules:

| Resource/action | Citizen | Staff | Admin |
|---|---:|---:|---:|
| Submit report | Yes | No | No |
| View own report | Yes | No unless province access | Yes |
| View province reports | No | Yes, own province only | Yes |
| Update report status | No | Yes, own province only | Yes |
| View all reports | No | No | Yes |
| Manage users | No | No | Yes |
| View province stats | No | No | Yes |
| View audit logs | No general access | Province-limited | Global |

### 6.5 Citizen Access Control

Implemented:

- `POST /reports` requires `require_citizen`.
- `GET /reports` filters citizens to `current_user.id`.
- `GET /reports/{report_id}` checks `report.citizen_id == current_user.id`.

Needs strengthening:

- `GET /reports/{report_id}/history` does not currently check citizen ownership. A citizen could potentially request another report's history if authenticated. This should mirror the ownership check in `GET /reports/{report_id}`.

### 6.6 Staff Access Control

Implemented:

- Staff login requires selected provincial council.
- Backend compares selected province with stored user province during login.
- Staff report listing is filtered by `current_user.provincial_council`.
- Staff report detail rejects reports outside assigned province.
- Staff status update rejects reports outside assigned province.
- Staff audit history joins reports and filters by province.

This is the core jurisdictional control model.

### 6.7 Admin Access Control

Implemented:

- Admin portal routes require role `ADMIN`.
- User management endpoints require `require_admin`.
- Province stats require `require_admin`.
- Admin can view and update global report records.

Admins act as global governance users and can correct province/district metadata.

### 6.8 Password Hashing

Passwords are hashed using:

```py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

Benefits:

- Passwords are not stored in plaintext.
- Bcrypt includes salting and adaptive work factor.

Recommendation:

- Enforce password policy server-side as well as frontend-side.
- Add rate limiting for login attempts.
- Avoid logging any credential-related details beyond safe metadata.

### 6.9 API Security

Implemented:

- JWT-protected endpoints.
- Role dependencies.
- Province checks.
- Generated file names.
- Account deactivation check during login.

Needed improvements:

- Configure CORS for known frontend origins only.
- Add request rate limiting.
- Add upload content validation.
- Add file size validation on backend.
- Add virus/malware scanning for uploads.
- Move debug endpoints behind admin authentication or disable in production.
- Return less account enumeration information from public endpoints.
- Rotate secrets found in local `.env` and ensure `.env` is ignored by Git.

### 6.10 CORS Handling

`backend/app/main.py` currently configures:

```py
allow_origins=["*"]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

Reason:

- Development support for separate citizen/staff/admin Vite ports.

Production recommendation:

- Restrict allowed origins to deployed frontend URLs.
- Avoid wildcard CORS with credentials.
- Use environment-specific CORS configuration.

### 6.11 Environment Variable Handling

`backend/app/config.py` uses `pydantic-settings`:

Required settings:

- `DATABASE_URL`
- `ROBOFLOW_API_KEY`
- `SECRET_KEY`

Optional/default settings:

- `ENVIRONMENT`
- `BACKEND_PUBLIC_URL`

Frontend environment:

- `VITE_API_BASE_URL`
- `VITE_PORTAL_MODE`

Important security issue:

- `.gitignore` currently does not explicitly ignore `.env`.
- The local backend `.env` contains sensitive values.
- Production-ready workflow should:
  - Add `.env` to `.gitignore`.
  - Commit `.env.example` with placeholder values.
  - Rotate any exposed database/API/JWT secrets.
  - Use secret managers or deployment environment variables.

---

## Section 7 - AI System Analysis

### 7.1 How AI Integration Works

RoadPulse performs AI-assisted verification during report submission.

Primary file:

- `backend/app/services/roboflow_service.py`

Integration flow:

1. `POST /reports` saves the uploaded image.
2. It calls `await analyze_pothole_image(file_path)`.
3. Roboflow returns predictions.
4. The service parses prediction confidence and bounding box values.
5. The best prediction is selected.
6. RoadPulse classification is assigned.
7. AI fields are stored on `citizen_reports`.
8. Full detection result is stored in `detection_results`.

### 7.2 Why Roboflow Was Selected

Roboflow is suitable for this project because:

- It provides hosted computer vision inference.
- It reduces infrastructure complexity.
- It avoids local GPU requirements.
- It provides an HTTP API usable from FastAPI.
- It allows the project to demonstrate AI-assisted validation without building a full MLOps pipeline.

This is appropriate for a university final year project because it allows focus on end-to-end system integration, workflows, dashboards, and public service value.

### 7.3 Image Upload Pipeline for AI

The AI pipeline uses the same image saved for report evidence:

- File saved to `uploads/{uuid}.{ext}`.
- File path sent to Roboflow client.
- Image URL stored separately for frontend display.

This avoids sending base64 image data through JSON and keeps upload handling aligned with standard multipart practices.

### 7.4 AI Inference Request Lifecycle

`roboflow_service.py` initializes:

```py
CLIENT = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=settings.ROBOFLOW_API_KEY
)
```

Inference call:

```py
response = await asyncio.to_thread(CLIENT.infer, image_path, model_id="pothole-voxrl/1")
```

Using `asyncio.to_thread()` prevents a blocking SDK call from blocking the event loop.

Fallback:

- If `inference_sdk` cannot be imported, a fallback class sends the image via `requests.post()` to Roboflow's detection endpoint.

### 7.5 AI Response Parsing

Expected response fields:

- `predictions`
- `image.width`
- `image.height`

Parsing logic:

1. Count predictions.
2. If predictions exist, choose the highest-confidence prediction.
3. Read:
   - `confidence`
   - `x`
   - `y`
   - `width`
   - `height`
4. Normalize bounding box if image dimensions are available.
5. Set `detected = True`.
6. Assign classification based on confidence.

If no predictions:

- `aiClassification` becomes `REJECTED`.

If exception occurs:

- `aiClassification` becomes `NEEDS_MANUAL_REVIEW`.

### 7.6 Detection Validation

Validation is threshold-based:

| Confidence | Classification | Operational meaning |
|---:|---|---|
| `>= 0.75` | `VERIFIED_POTHOLE` | Automatically verified as a pothole. Initial report status becomes `Verified`. |
| `>= 0.50` and `< 0.75` | `NEEDS_MANUAL_REVIEW` | Requires staff review. Initial report status becomes `New`. |
| `< 0.50` | `REJECTED` | AI rejects the report. Initial report status becomes `Rejected`. |
| No predictions | `REJECTED` | No pothole detected. |
| Inference failure | `NEEDS_MANUAL_REVIEW` | Avoid blocking citizen submission due to AI outage. |

### 7.7 Confidence Handling

Confidence is stored in:

- `citizen_reports.ai_confidence`
- `detection_results.confidence`

Frontend displays confidence in:

- `StaffReportDetail.tsx`
- `EvidenceViewer.tsx` when used.
- Admin attention lists in `Overview.tsx`.

### 7.8 Bounding Box Handling

Roboflow prediction values are converted into normalized bounding box format:

```text
[x_min_normalized, y_min_normalized, width_normalized, height_normalized]
```

If image dimensions are available:

- `norm_x = (x - w / 2) / img_w`
- `norm_y = (y - h / 2) / img_h`
- `norm_w = w / img_w`
- `norm_h = h / img_h`

Frontend `EvidenceViewer.tsx` can overlay bounding boxes by multiplying these values by image dimensions in CSS percentages.

### 7.9 Evidence Verification Process

RoadPulse does not rely solely on AI. The AI result supports the maintenance workflow:

- High confidence reports are immediately set to `Verified`.
- Medium confidence reports remain `New` and enter manual review.
- Low confidence/no detection reports are marked `Rejected`.
- Staff can still inspect visual evidence and update lifecycle status.
- Admin can override province, district, status, and priority.

This human-in-the-loop model is important for public infrastructure because false positives and false negatives have operational consequences.

### 7.10 AI-Assisted Maintenance Workflow

AI classification influences dashboards:

- `VERIFIED_POTHOLE` contributes to verified counts.
- `NEEDS_MANUAL_REVIEW` contributes to manual review queues.
- `REJECTED` contributes to rejected report views.

Staff workflow:

1. Inspect AI classification.
2. Review image and coordinates.
3. Accept as verified, reject, schedule, start, or complete.
4. Add maintenance notes and priority.

### 7.11 Current AI Limitations

Current limitations:

- No custom model training pipeline is included in the repository.
- Roboflow model is externally hosted.
- AI depends on network availability and API key validity.
- The system uses fixed confidence thresholds.
- Bounding boxes are stored but not consistently used across all active pages.
- There is no duplicate report detection.
- There is no severity estimation.
- There is no road surface segmentation.
- There is no automated image quality assessment beyond a basic frontend file-size hint.
- The backend direct AI endpoint currently misses `await`.

### 7.12 Why API-Based Inference Was Chosen

API-based inference was chosen because:

- It reduces local setup complexity.
- It works without GPU hardware.
- It is easier to demonstrate in a dissertation prototype.
- It allows a complete end-to-end system to be built around AI without owning all ML infrastructure.

Trade-off:

- The system depends on an external provider.
- Latency and availability are outside full project control.
- Model retraining and evaluation are not visible in the codebase.

### 7.13 Future AI Improvements

Recommended AI enhancements:

- Train a custom pothole model using local Sri Lankan road datasets.
- Add severity estimation:
  - area of pothole
  - depth estimation if possible
  - traffic risk score
- Add road segmentation to separate potholes from shadows, drains, and roadside objects.
- Add duplicate report detection using spatial and image similarity.
- Add image quality scoring before submission.
- Add multi-model ensemble confidence.
- Add explainability metadata for officer review.
- Add automatic priority suggestions.
- Add offline/on-device detection for a future mobile app.

---

## Section 8 - Dashboard Workflow Analysis

### 8.1 Citizen Workflow

Citizen lifecycle:

1. Opens citizen portal at `/citizen`.
2. Reads reporting guidance.
3. Creates account or signs in.
4. Opens `/citizen/report`.
5. Captures evidence image.
6. Confirms location.
7. Adds descriptive details.
8. Reviews submission.
9. Submits report.
10. Views status page.
11. Tracks all reports in `/citizen/my-reports`.

Status visibility:

- `New` becomes "Under Review".
- `Verified` becomes "Verified".
- `Scheduled` becomes "Repair Scheduled".
- `In Progress` becomes "Repair In Progress".
- `Completed` becomes "Fixed".
- `Rejected` becomes "Not Accepted".

### 8.2 Staff Workflow

Staff lifecycle:

1. Opens staff portal.
2. Selects provincial council during login.
3. Backend confirms selected province matches stored officer province.
4. Staff lands on `/staff/overview`.
5. Staff views province-only metrics.
6. Staff opens queue cards.
7. Staff reviews reports in `FilteredReportList`.
8. Staff opens report detail.
9. Staff verifies, schedules, starts, completes, or rejects.
10. Staff uses live map for geospatial operations.
11. Staff views maintenance history.

Operational lifecycle:

```text
New
  -> Verified
  -> Scheduled
  -> In Progress
  -> Completed

New or Verified
  -> Rejected
```

### 8.3 Admin Workflow

Admin lifecycle:

1. Opens admin portal.
2. Logs in through shared `LoginPage` in admin mode.
3. Views `/admin/overview`.
4. Monitors national totals and province activity.
5. Opens global reports table.
6. Opens report detail for governance override.
7. Corrects province/district/status/priority if needed.
8. Manages users in `/admin/users`.
9. Reviews audit logs in `/admin/audit-logs`.
10. Checks system diagnostics in `/admin/settings`.

Admin capabilities:

- Global report visibility.
- Global update authority.
- User account status control.
- Province analytics.
- Audit log monitoring.

### 8.4 Report Lifecycle

Initial status is derived from AI classification in `POST /reports`:

| AI classification | Initial status |
|---|---|
| `VERIFIED_POTHOLE` | `Verified` |
| `REJECTED` | `Rejected` |
| `NEEDS_MANUAL_REVIEW` | `New` |

Staff/admin lifecycle actions update the same `citizen_reports.status` field and create history records.

### 8.5 Status Synchronization

Status synchronization is achieved through:

- Backend persistence in `citizen_reports.status`.
- Frontend polling.
- API normalization.
- Canonical status mapping in `src/lib/status.ts`.
- Backend status alias mapping in `backend/app/routers/reports.py`.

This prevents small naming differences such as `fixed`, `repair completed`, and `Completed` from breaking dashboard logic.

### 8.6 Filtering Systems

Staff filters:

- Province filtering from JWT user.
- Category filtering through backend.
- Search by report ID, district, or description.
- District filtering.
- Priority filtering.
- Status filtering.
- Date filtering on map.

Admin filters:

- Search.
- Province.
- District.
- Status.
- Pagination.

Citizen filters:

- Friendly lifecycle status groups.

### 8.7 Live Updates

Live updates are implemented with timed polling:

- Citizen reports: 30 seconds.
- Staff overview: 30 seconds.
- Staff live map: 30 seconds.
- Admin overview: 30 seconds.
- Backend status: 10 seconds.

This creates "near real-time" behavior without a WebSocket server.

### 8.8 Province Routing

Province routing happens in two places:

- Backend assigns province during report creation using coordinates.
- Frontend uses province resolver to normalize and center maps.

Staff access relies on canonical province names. The helper `fix_provinces.py` exists to migrate older names such as `Western Province` into `Western Provincial Council`.

### 8.9 District Filtering

District data is stored on each report. The resolver currently chooses the first district of a matched province. This gives a prototype district value but is not true geocoding.

Frontend district filters are robust to case and text variations through `normalizeDistrict()`.

### 8.10 Maintenance Scheduling

Maintenance scheduling is represented by status transitions:

- `Verified` means accepted for repair.
- `Scheduled` means work is planned.
- `In Progress` means crew activity has started.
- `Completed` means repair is finalized.

There is no dedicated scheduling table yet. Scheduled date, assigned team, and repair crew are currently represented mainly in frontend types and notes, not as first-class database columns.

### 8.11 Verification Process

Verification combines:

- AI classification.
- Image evidence.
- GPS coordinates.
- Staff manual review.
- Admin override.

This design is appropriate because computer vision can assist but should not fully replace human judgment in public infrastructure decisions.

### 8.12 Repair Completion Process

Completion happens through:

- Staff detail page lifecycle action.
- Live map action.
- Filtered report list action.

Backend effect:

- `citizen_reports.status` becomes `Completed`.
- `citizen_reports.last_status_updated_at` is updated.
- `audit_logs` entry is created.
- `status_updates` entry is created.

Frontend effect:

- Completed reports disappear from active live map because the map only shows `Verified`, `Scheduled`, and `In Progress`.

---

## Section 9 - Map and Location System

### 9.1 Leaflet Implementation

RoadPulse uses:

- `leaflet`
- `react-leaflet`
- `react-leaflet-cluster`

Map files:

- `src/pages/citizen/ReportWizard.tsx`
- `src/pages/LiveMap.tsx`
- `src/pages/ReviewQueue.tsx` legacy page

Tile providers:

- Citizen manual pin map uses Carto light tiles.
- Staff live map uses Carto light tiles with OpenStreetMap/CARTO attribution.
- Legacy review queue uses OpenStreetMap tiles.

### 9.2 Marker Rendering

Citizen marker:

- Standard Leaflet marker.
- The app fixes default Leaflet icon path issues by configuring marker icon URLs.

Staff live map markers:

- Custom `L.divIcon`.
- Rendered as colored circular markers.
- Color is based on report status:
  - `Verified`: green
  - `Scheduled`: orange
  - `In Progress`: blue
  - fallback: slate

### 9.3 Province Filtering

Province filtering is essential for staff dashboards.

Frontend:

- `filterReportsForProvince()` compares normalized province strings.
- `canonicalizeProvince()` converts province strings into official names.
- `getProvinceCenter()` returns map centers for each province.

Backend:

- Staff users are restricted by `current_user.provincial_council`.
- Admin can filter by `provincialCouncil`.

### 9.4 District Filtering

District lists are defined in both:

- `src/lib/provinceResolver.ts`
- `backend/app/services/province_resolver.py`

Frontend LiveMap uses:

- `PROVINCE_DISTRICTS[officerProvince]`
- `normalizeDistrict(report.district)`

This ensures the district dropdown only shows districts in the officer's province.

### 9.5 Clustering

`src/pages/LiveMap.tsx` uses `MarkerClusterGroup`:

```tsx
<MarkerClusterGroup
  chunkedLoading
  spiderfyOnMaxZoom
  showCoverageOnHover={false}
  maxClusterRadius={40}
>
```

Benefits:

- Reduces clutter when many reports are close together.
- Improves map rendering performance.
- Improves officer usability when viewing urban areas.

### 9.6 Geolocation Usage

Citizen report location supports:

- Browser GPS through `navigator.geolocation.getCurrentPosition`.
- Manual map pin selection.

Geolocation options:

- `enableHighAccuracy: true`
- `timeout: 10000`
- `maximumAge: 0`

If geolocation fails:

- User sees error asking them to enable access or pin manually.

### 9.7 Coordinate Handling

Coordinates are stored as floats:

- Backend fields:
  - `latitude`
  - `longitude`
- Frontend normalized fields:
  - `lat`
  - `lon`

Default citizen map initial coordinate:

- Colombo approximate coordinate: `6.9271, 79.8612`.

ReportWizard prevents continuing if latitude remains at the default coordinate, treating it as not selected.

### 9.8 Map Synchronization

Map synchronization happens when:

- Officer selects a marker.
- District/status/priority/date/search filters change.
- Province changes.
- Polling updates report data.

The `MapController` component calls `map.flyTo(center, zoom)` when selected center changes.

### 9.9 Report Visualization

The map visualizes only operational records that require field attention:

- `Verified`
- `Scheduled`
- `In Progress`

Completed and rejected reports are excluded from the live operational map.

This design keeps the map focused on actionable field work.

---

## Section 10 - UI/UX Engineering Analysis

### 10.1 Design Language

The system uses a premium civic dashboard design language:

- Slate/navy base palette.
- Blue accent for primary actions and admin telemetry.
- Emerald for verified/success/maintenance actions.
- Amber/orange for review and scheduling.
- Rose for rejection, errors, and overdue states.
- Rounded panels and cards.
- Strong uppercase labels for dashboard affordances.
- Dense tables for admin screens.
- Mobile-friendly card lists for smaller screens.

### 10.2 Dashboard Styling

Styling is centralized through:

- Tailwind utility classes.
- CSS variables in `src/index.css`.
- Shared utility classes:
  - `.section-heading`
  - `.btn-premium`
  - `.card-premium`
  - `.table-premium`
  - `.status-pill`

This creates consistency while allowing page-specific layout decisions.

### 10.3 Responsive Layouts

Responsive decisions:

- Citizen portal is mobile-first because citizens may report from roadside smartphones.
- Staff/admin portals use sidebars on desktop and drawers/overlays on mobile.
- Data-heavy screens use tables on desktop and card lists on mobile.
- Live map uses side filters on desktop and a drawer on mobile.

### 10.4 Accessibility

Positive accessibility practices:

- Buttons and links generally use semantic elements.
- Many icon buttons include `aria-label` or `title`.
- Focus-visible styles are globally defined in `src/index.css`.
- Status colors are paired with text labels and icons.
- Error messages are shown near form fields.

Areas to improve:

- Some icon-only buttons lack accessible labels.
- Some decorative uppercase small text may reduce readability.
- Some hover-only image preview patterns are not accessible to touch-only users.
- Color contrast should be audited formally.
- Keyboard navigation through complex map/drawer controls should be tested.

### 10.5 User-Centered Design Decisions

Citizen-centered:

- Simple three-step explanation.
- Camera-first report submission.
- Safety reminder.
- Photo guidance modal.
- Report timeline with friendly labels.

Staff-centered:

- Province scope is always visible.
- Overview cards map directly to operational queues.
- Live map focuses on active work only.
- Quick status actions reduce navigation.

Admin-centered:

- Global telemetry and reports.
- Province performance analytics.
- Governance override tools.
- User management and audit views.

### 10.6 Workflow Simplification

The UI minimizes cognitive load:

- Citizens do not need to know maintenance categories.
- Officers are shown only their provincial records.
- Admins can search/filter all records.
- Status transitions are presented as direct buttons.
- Reusable status pills make state recognition consistent.

### 10.7 Mobile Optimization

Mobile optimization appears strongest in the citizen flow:

- Camera capture input.
- Full-screen location picker.
- Single-column wizard.
- Large touch targets.
- Sticky/minimal navigation.

Staff/admin mobile support exists through responsive layouts, but dense governance tables remain more comfortable on desktop.

### 10.8 Reporting Guidance System

`ReportWizard.tsx` imports:

- `photo-guidance-correct-v2.png`
- `photo-guidance-incorrect-v2.png`

The guidance modal instructs citizens to align road edges and capture useful evidence. This improves downstream AI accuracy and human verification.

### 10.9 Citizen Photo Capture Guidance

The citizen report UI:

- Encourages safe capture.
- Uses `capture="environment"` to open the rear camera on mobile devices where supported.
- Provides correct/incorrect examples.
- Warns when image file size may indicate poor quality.

This is important because AI model performance depends heavily on input image quality.

### 10.10 Strengths

- Clear multi-role separation.
- Strong evidence-first citizen workflow.
- Consistent dashboard design language.
- Good use of maps for a location-centric problem.
- Operational status lifecycle is understandable.
- Human-in-the-loop design supports real-world safety.
- Admin governance tools improve maintainability.

### 10.11 Weaknesses

- Some styling uses very large border radii that may not match utilitarian public-sector dashboard conventions.
- Several debug panels/log statements remain visible in staff pages.
- Some UI labels use "telemetry/protocol" language that may be less clear for nontechnical government users.
- Settings screen includes hardcoded informational data rather than backend-managed settings.
- Some legacy pages may confuse maintainers if not documented or removed.

---

## Section 11 - Error Handling and Debugging

### 11.1 Runtime Error Handling

Top-level frontend error boundary:

- `src/App.tsx`
- Catches render errors.
- Logs error and component stack.
- Displays fallback UI and reload button.

This prevents a complete blank screen, which is valuable in dashboard systems.

### 11.2 Frontend Fallback Handling

API fallback:

- `withFallback()` in `src/lib/api.ts`.
- Because `USE_MOCK = false`, backend failure is surfaced instead of using mock data.
- Staff/admin portals explicitly require live database connection.

Backend status:

- `BackendStatusBanner` checks `/debug/db`.
- Shows warning when backend/database health fails.

Potential inconsistency:

- Banner text says "Showing offline demo data", but `USE_MOCK=false` means demo fallback is disabled. The banner copy should be updated to match current behavior.

### 11.3 Backend Exception Handling

Report creation:

- Uses broad try/catch.
- Rolls back DB on critical failure.
- AI errors are non-fatal.
- Detection persistence errors are non-fatal.
- Audit persistence errors are non-fatal.

Auth:

- Uses explicit `HTTPException` for invalid credentials, deactivated accounts, and insufficient privileges.

Reports:

- Uses `HTTPException` for invalid status, not found, and access restriction.

### 11.4 Validation Handling

Frontend:

- Auth forms validate email and password.
- Signup validates password strength.
- Report wizard validates file type, file size, location, and description/landmark.

Backend:

- Pydantic validates JSON schemas.
- FastAPI validates required form fields and file field.
- Status normalization rejects unsupported statuses.
- Backend does not currently validate upload MIME type or size.

### 11.5 Authentication Failures

Authentication failures produce:

- `401` for invalid credentials.
- `403` for deactivated accounts.
- `403` for insufficient role.

Frontend displays:

- Login failure alert.
- Staff access denied message.
- Protected route redirection.

### 11.6 Synchronization Failures

Sync failures are handled per page:

- MyReports shows database sync error and retry button.
- MaintenanceOverview shows overview unavailable.
- LiveMap shows map data failure.
- FilteredReportList shows report loading error.
- StaffReportDetail shows failure message.

### 11.7 Upload Failures

Upload can fail due to:

- Missing image.
- File write errors.
- Database errors.
- Backend unavailable.
- AI timeout or failure.

AI failure does not block submission; the report is marked for manual review.

Critical upload failure returns:

```text
500 Failed to save report: ...
```

### 11.8 Database Failures

Database failures:

- Surface through `/debug/db`.
- Cause API calls to throw.
- Trigger frontend backend-down state.

Backend startup:

- `Base.metadata.create_all()` requires database connection at startup.

### 11.9 Debugging Utilities

Backend utilities:

- `backend/check_db.py` prints report and user counts.
- `backend/fix_provinces.py` migrates province naming.
- `backend/reset_test_user.py` recreates a test citizen.
- `backend/seed_users.py` seeds admin and provincial officer accounts.
- `backend/seed_db.py` resets and seeds test data.

Debug endpoints:

- `/debug/db`
- `/debug/reports`

Production recommendation:

- Protect or disable debug endpoints outside development.

---

## Section 12 - System Performance Analysis

### 12.1 Rendering Performance

Performance strengths:

- React components are modular.
- `useMemo` is used for derived filtering and dashboard metrics.
- Loading states prevent layout stalls.
- `ResponsiveDataList` avoids rendering both mobile and desktop complex layouts visibly at the same breakpoint.

Potential issues:

- Some pages fetch `limit: 1000` and filter client-side.
- Frequent console logging can degrade performance and clutter debugging.
- Large image previews can impact memory on mobile.
- Admin overview polls multiple large endpoints every 30 seconds.

### 12.2 API Performance

Good API practices:

- Paginated endpoints for reports, users, and audit logs.
- Backend role filtering limits staff/citizen data.
- Query composition occurs before pagination.

Performance concerns:

- Some frontend pages request `limit: 1000`.
- `GET /auth/users` does not implement search/role/province filters despite frontend params.
- Report creation waits for AI inference before responding.
- Multiple commits during report creation increase database round trips.

### 12.3 Map Performance

Map strengths:

- Uses marker clustering.
- Filters active statuses.
- Uses province-level scoping.
- Uses `maxClusterRadius=40`.

Map concerns:

- Map fetches up to 1000 records.
- No map viewport/tile-based backend query.
- Coordinates are stored as plain floats, not geospatial indexed points.

Future optimization:

- Add bounding-box API queries based on visible map bounds.
- Add geospatial indexes with PostGIS.
- Use server-side status/province filtering for all map views.

### 12.4 Image Processing Performance

Frontend:

- Generates compressed preview with canvas.
- But submits original image file, not compressed preview.

Backend:

- Writes upload to disk.
- Sends image to Roboflow.

Concerns:

- Large original images can increase upload latency and AI processing time.
- Filesystem storage can become a bottleneck.
- No image resizing/compression on the backend.

Recommended optimization:

- Compress/resize image before upload or on backend before AI inference.
- Store originals in object storage.
- Generate thumbnails for dashboards.
- Use background tasks for AI processing if immediate response is not required.

### 12.5 Database Performance

Current query load is manageable for prototype scale.

Potential bottlenecks:

- Missing indexes on frequent filter fields.
- Repeated polling of large report sets.
- Audit log joins may become expensive without indexes.
- JSON fields are useful but should not be overused for frequently queried values.

Recommended improvements:

- Add indexes listed in Section 5.
- Add migration management.
- Add summary endpoints for dashboard cards instead of fetching all records.
- Add caching for admin overview metrics.

### 12.6 Scalability Concerns

Major scalability concerns:

- Local filesystem uploads do not scale across multiple backend instances.
- Polling does not scale as efficiently as push updates.
- Province/district assignment is approximate.
- No background job queue.
- No CDN/object storage for image files.
- No database connection pool tuning.
- No production migration workflow.

### 12.7 Optimization Techniques Already Present

Existing optimizations:

- Frontend status/province normalization avoids repeated ad hoc logic.
- Map marker clustering.
- Pagination on major list endpoints.
- `asyncio.to_thread()` prevents Roboflow SDK from blocking async event loop.
- AI failure is non-fatal to citizen submission.
- `useMemo` avoids recalculating dashboard metrics unnecessarily.

---

## Section 13 - Current Limitations

### 13.1 Architectural Limitations

- Single backend local upload directory.
- No object storage integration.
- No queue for asynchronous AI jobs.
- No WebSocket or server-sent event live updates.
- No formal migration folder despite Alembic being in requirements.
- Startup table creation is used instead of managed migrations.
- Some legacy pages are not routed but remain in source.

### 13.2 AI Limitations

- No custom training code.
- External API dependency.
- Fixed confidence thresholds.
- No severity estimation.
- No duplicate detection.
- No image quality validation on backend.
- Direct AI endpoint has async bug.

### 13.3 Database Limitations

- No explicit indexes beyond user email.
- Province and district are stored as free-form strings.
- Status is stored as string instead of enum/lookup table.
- No separate image metadata table.
- No PostGIS support yet.
- Audit logs are not enriched with joined actor/province data in backend response.

### 13.4 Security Limitations

- CORS is open to all origins.
- `.env` is not explicitly ignored by `.gitignore`.
- Local `.env` contains sensitive values and should be rotated.
- JWT stored in localStorage.
- No refresh token/revocation.
- No rate limiting.
- Public email check endpoints can support enumeration.
- Debug endpoint `/debug/db` is public.
- Upload validation is incomplete.

### 13.5 Offline Limitations

- PWA configuration exists in `vite.config.ts`.
- Offline page exists but is not routed.
- Citizen reporting does not currently queue submissions offline.
- Reports require backend connectivity.

### 13.6 Deployment Limitations

- Requires PostgreSQL configuration.
- Requires valid Roboflow API key.
- Uses local upload storage.
- CORS must be configured for real deployment.
- Static serving of uploads through FastAPI may not be ideal for production.
- No Dockerfile or deployment manifests were found in inspected files.

### 13.7 Workflow Limitations

- Maintenance scheduling lacks structured fields for assigned crew and scheduled date in backend model.
- District assignment is approximate.
- Admin settings are mostly frontend/local informational settings.
- Some frontend filters are not supported by backend.
- User creation for staff/admin is handled through seed scripts and admin update, not a full admin create-user UI.

---

## Section 14 - Future Enhancements

### 14.1 Advanced AI Features

- Custom pothole detection model trained on local Sri Lankan road imagery.
- Severity classification:
  - small
  - moderate
  - severe
  - hazardous
- Surface type recognition.
- Road lane/edge segmentation.
- Multi-image report support.
- Duplicate report detection.
- Image quality scoring.
- Automatic repair priority recommendation.

### 14.2 Smart Prioritization

Future priority score could combine:

- AI confidence.
- Estimated pothole size.
- Road category.
- Traffic volume.
- Number of duplicate citizen reports.
- Age of report.
- Accident-prone location data.
- Weather/rainfall conditions.
- Proximity to schools/hospitals.

### 14.3 Predictive Analytics

Predictive analytics could include:

- Province-wise pothole trend forecasting.
- Seasonal road damage analysis.
- High-risk road segment prediction.
- Maintenance backlog prediction.
- Repair completion time estimation.

### 14.4 Repair Scheduling Optimization

Recommended scheduling enhancements:

- Dedicated `repair_jobs` table.
- Assigned team field.
- Scheduled date field.
- Completion evidence upload.
- Crew workload balancing.
- Route optimization for repair crews.
- SLA tracking.
- Material and cost estimation.

### 14.5 Mobile App Expansion

A native or cross-platform mobile app could provide:

- Offline report queue.
- Background GPS capture.
- Push notifications.
- Camera quality enforcement.
- On-device AI inference.
- Citizen report history with local cache.

### 14.6 IoT Integrations

Potential IoT integrations:

- Vehicle-mounted road vibration sensors.
- Dashcam pothole detection.
- Municipal fleet automatic reporting.
- Roadside weather sensors.
- Smart city infrastructure dashboards.

### 14.7 Computer Vision Improvements

- Train on diverse lighting and weather conditions.
- Detect cracks, waterlogging, manhole damage, and edge failures.
- Estimate pothole area from bounding box and camera calibration.
- Segment road surface for better localization.
- Support video frame extraction.

### 14.8 GIS Integrations

- Replace bounding boxes with official provincial and district polygons.
- Use PostGIS geometry columns.
- Reverse geocode coordinates.
- Integrate with road network shapefiles.
- Display road authority boundaries.
- Add heatmaps and density layers.

### 14.9 Cloud Deployment Improvements

- Dockerize frontend and backend.
- Use managed PostgreSQL.
- Use cloud object storage for uploads.
- Put CDN in front of uploaded images.
- Use secret manager.
- Add CI/CD pipeline.
- Add health checks and observability.
- Add structured logging and metrics.

---

## Section 15 - Complete File and Component Index

### 15.1 Root Configuration Files

| File | Purpose |
|---|---|
| `package.json` | Frontend dependencies and scripts. Defines `dev:citizen`, `dev:staff`, `dev:admin`, `build`, `lint`, and `preview`. |
| `vite.config.ts` | Vite React setup and PWA plugin configuration. |
| `tailwind.config.js` | Tailwind content paths, semantic colors, premium shadow extension. |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | TypeScript configuration. |
| `postcss.config.js` | PostCSS and Tailwind pipeline. |
| `.env.citizen` | Citizen portal mode and API base URL. |
| `.env.staff` | Staff portal mode and API base URL. |
| `.env.admin` | Admin portal mode and API base URL. |
| `.gitignore` | Ignores node modules and build files. Should add `.env`. |

### 15.2 Frontend Core Files

| File | Purpose |
|---|---|
| `src/main.tsx` | React DOM entry point. Renders `App`. |
| `src/App.tsx` | Top-level error boundary, auth provider, router, and role-specific route trees. |
| `src/types.ts` | Shared TypeScript types for users, reports, pothole events, repair updates, audit logs, pagination. |
| `src/index.css` | Global Tailwind imports, CSS variables, shared component classes, animations, table styles. |
| `src/App.css` | Default Vite template styling; not central to current application styling. |

### 15.3 Frontend Contexts and Libraries

| File | Purpose |
|---|---|
| `src/context/AuthContext.tsx` | Session management, login/signup/logout, localStorage persistence, role home paths. |
| `src/lib/api.ts` | Central API client, backend health check, report normalization, domain API wrappers. |
| `src/lib/status.ts` | Canonical report status mapping and comparison. |
| `src/lib/provinceResolver.ts` | Province boundaries, district lists, province/district normalization, map centers. |
| `src/lib/staffReportFilters.ts` | Staff report predicates and province filtering. |
| `src/lib/aiValidationService.ts` | Legacy/mock YOLO detection simulator. Not used by active backend-based AI workflow. |
| `src/lib/utils.ts` | Simple class name join helper `cn`. |

### 15.4 Frontend Layout Components

| File | Purpose |
|---|---|
| `src/components/CitizenLayout.tsx` | Citizen navigation, mobile menu, footer, FAQ. |
| `src/components/StaffLayout.tsx` | Staff sidebar, header, backend banner, maintenance console layout. |
| `src/components/AdminLayout.tsx` | Admin sidebar, header, system status indicator, command-center layout. |

### 15.5 Frontend Shared Components

| File | Purpose |
|---|---|
| `src/components/ProtectedRoute.tsx` | Authentication and role-protected route wrapper. |
| `src/components/StatusPill.tsx` | Status label/icon/color renderer. |
| `src/components/ActivityTimeline.tsx` | Audit log timeline for an entity. |
| `src/components/EvidenceViewer.tsx` | Evidence image viewer with metadata and bounding box overlay. |
| `src/components/ResponsiveDataList.tsx` | Table/card responsive data list abstraction. |
| `src/components/Pagination.tsx` | Shared pagination controls. |
| `src/components/AuthInput.tsx` | Auth form input with icon, password toggle, Caps Lock warning. |
| `src/components/Alert.tsx` | Alert notification component. |
| `src/components/BackendStatusBanner.tsx` | Backend/database health warning banner. |
| `src/components/EmptyState.tsx` | Empty state renderer. |
| `src/components/Skeleton.tsx` | Skeleton loading component. |
| `src/components/Logo.tsx` | RoadPulse logo component. |

### 15.6 Citizen Pages

| File | Purpose |
|---|---|
| `src/pages/citizen/CitizenHome.tsx` | Public citizen landing page. |
| `src/pages/citizen/ReportWizard.tsx` | Multi-step pothole reporting workflow. |
| `src/pages/citizen/MyReports.tsx` | Citizen report list and status filters. |
| `src/pages/citizen/ReportStatus.tsx` | Citizen lifecycle timeline for one report. |
| `src/pages/Login.tsx` | Shared citizen/admin login page. |
| `src/pages/Signup.tsx` | Citizen registration page. |

### 15.7 Staff Pages

| File | Purpose |
|---|---|
| `src/pages/StaffLogin.tsx` | Staff login with provincial council selector. |
| `src/pages/MaintenanceOverview.tsx` | Province-level staff dashboard cards. |
| `src/pages/LiveMap.tsx` | Province-level active repair map with clustering and quick actions. |
| `src/pages/FilteredReportList.tsx` | Staff report queues by category. |
| `src/pages/StaffReportDetail.tsx` | Staff report evidence, AI analysis, priority, notes, lifecycle actions. |
| `src/pages/ReportMaintenanceHistory.tsx` | Province-level maintenance history. |

### 15.8 Admin Pages

| File | Purpose |
|---|---|
| `src/pages/Overview.tsx` | Global admin overview dashboard. |
| `src/pages/AdminReports.tsx` | Global reports table with filters and pagination. |
| `src/pages/AdminReportDetail.tsx` | Admin report inspection and metadata override page. |
| `src/pages/ProvinceMonitoring.tsx` | Province performance analytics and charts. |
| `src/pages/Users.tsx` | Admin user directory and account status management. |
| `src/pages/AuditLogs.tsx` | System audit trail. |
| `src/pages/Settings.tsx` | System diagnostics and informational settings. |

### 15.9 Legacy or Inactive Frontend Pages

| File | Purpose |
|---|---|
| `src/pages/ReviewQueue.tsx` | Alternative report review interface, currently not routed. |
| `src/pages/Repairs.tsx` | Repair board, currently not routed. |
| `src/pages/PotholesTable.tsx` | Pothole inventory table, currently not routed. |
| `src/pages/PotholeDetail.tsx` | Pothole record detail, currently not routed. |
| `src/pages/Admin.tsx` | Older combined admin page, currently not routed. |
| `src/pages/Offline.tsx` | Offline page, currently not routed. |

### 15.10 Backend Core Files

| File | Purpose |
|---|---|
| `backend/app/main.py` | FastAPI app initialization, CORS, static files, router inclusion, health/debug endpoints. |
| `backend/app/config.py` | Pydantic settings and environment variable loading. |
| `backend/app/database.py` | SQLAlchemy engine, session factory, base model, DB dependency. |
| `backend/app/models.py` | SQLAlchemy table models. |
| `backend/app/schemas.py` | Pydantic request/response models. |
| `backend/app/crud.py` | Database service functions. |
| `backend/app/security.py` | Password hashing, JWT creation/validation, role dependencies. |
| `backend/app/init_db.py` | Table creation helper. |

### 15.11 Backend Routers

| File | Purpose |
|---|---|
| `backend/app/routers/auth.py` | Login, signup, staff verification, email check, admin user management. |
| `backend/app/routers/reports.py` | Report submission, listing, filtering, status updates, history, province stats. |
| `backend/app/routers/ai.py` | Staff-only direct AI image analysis endpoint. Needs async await fix. |

### 15.12 Backend Services

| File | Purpose |
|---|---|
| `backend/app/services/roboflow_service.py` | Roboflow API inference integration and response mapping. |
| `backend/app/services/province_resolver.py` | Coordinate-to-province/district resolver. |
| `backend/app/services/ai_service.py` | Mock/future YOLO service. Not used by active report creation pipeline. |

### 15.13 Backend Scripts

| File | Purpose |
|---|---|
| `backend/seed_users.py` | Seeds admin and provincial maintenance officer accounts. |
| `backend/seed_db.py` | Drops/recreates tables and seeds sample users/reports. Uses older province names in some sample data. |
| `backend/fix_provinces.py` | Converts old province labels to canonical "Provincial Council" labels. |
| `backend/check_db.py` | Prints report/user counts and latest database records. |
| `backend/reset_test_user.py` | Recreates a test citizen account. |

---

## Section 16 - Final Technical Evaluation

### 16.1 Overall System Evaluation

RoadPulse is a strong full-stack final year project implementation because it addresses a realistic civic infrastructure problem with a complete user-facing workflow, role-based dashboards, AI integration, database persistence, map visualization, and administrative oversight.

The system is more than a CRUD application. It demonstrates:

- Authentication.
- Multi-role authorization.
- File upload.
- AI inference integration.
- Geospatial routing.
- Relational persistence.
- Auditability.
- Dashboard analytics.
- Responsive UI engineering.

### 16.2 Production Readiness

Prototype readiness:

- Strong.
- The system can demonstrate the complete lifecycle from citizen submission to staff completion.
- PostgreSQL and FastAPI provide a credible backend foundation.
- React and Tailwind provide a polished UI.

Production readiness:

- Moderate but not complete.
- Key production requirements remain:
  - Secret rotation and `.env` hygiene.
  - Restricted CORS.
  - Upload validation.
  - Object storage.
  - Migrations.
  - Rate limiting.
  - Better audit response enrichment.
  - Stronger citizen history authorization.
  - Background AI processing or timeout controls.
  - Deployment infrastructure.

### 16.3 Maintainability Analysis

Maintainability strengths:

- Clear frontend route structure.
- Centralized API client.
- Centralized status and province normalization.
- Domain-separated backend routers.
- Clear SQLAlchemy models.
- Reusable UI components.

Maintainability issues:

- Legacy pages should be removed, routed, or documented as archived.
- Some frontend/backend filter contracts are mismatched.
- Audit action vocabulary should be standardized.
- Duplicate province/district definitions exist in frontend and backend.
- Several debug panels and logs should be removed or environment-gated.

### 16.4 Scalability Analysis

Scalable foundations:

- Stateless JWT auth.
- PostgreSQL backend.
- API-based frontend/backend separation.
- Pagination on important tables.

Scalability gaps:

- Polling large records.
- Local file uploads.
- No object storage/CDN.
- Missing indexes.
- No queue for AI inference.
- No GIS database support yet.

### 16.5 Usability Analysis

Usability strengths:

- Citizen workflow is guided and mobile-focused.
- Staff dashboard maps directly to operational tasks.
- Admin dashboard provides high-level and detailed controls.
- Status timelines improve transparency.
- Map view is highly relevant for maintenance teams.

Usability gaps:

- Some labels are technical and could be simplified for government users.
- Debug panels should be hidden in production.
- Admin settings are not true backend settings.
- Hover-only interactions should be complemented with touch/click alternatives.

### 16.6 AI Effectiveness Analysis

The AI layer is effective as an assisted verification mechanism, not as a fully autonomous decision-maker.

Strengths:

- Integrates real API inference.
- Stores confidence, bounding box, raw response, and model metadata.
- Supports human review.
- Does not block report submission if inference fails.

Weaknesses:

- External model dependency.
- No custom training/evaluation code.
- Fixed thresholds.
- No duplicate or severity analysis.
- Direct AI endpoint bug.

### 16.7 Software Engineering Quality Assessment

Overall quality:

- The project shows solid end-to-end engineering.
- The core workflows are implemented with realistic concerns: roles, reports, evidence, maps, status, audit, AI.
- The frontend is polished and carefully structured.
- The backend is understandable and uses appropriate frameworks.

Academic value:

- The system provides rich material for dissertation chapters on:
  - requirements analysis
  - system architecture
  - AI-assisted decision support
  - database design
  - role-based access control
  - geospatial routing
  - UI/UX design
  - evaluation and limitations

Recommended final engineering priorities before formal submission:

1. Add `.env` to `.gitignore` and rotate exposed secrets.
2. Fix `backend/app/routers/ai.py` to await `analyze_pothole_image`.
3. Add citizen ownership check to `GET /reports/{report_id}/history`.
4. Add backend upload validation.
5. Remove or hide debug panels and excessive console logging.
6. Implement backend filters for users or remove unsupported frontend filter params.
7. Add database indexes for report filtering and audit lookup.
8. Add migration management with Alembic.
9. Decide whether legacy pages should be routed or archived.
10. Replace approximate district resolution with GIS/reverse geocoding in future work.

Final assessment:

RoadPulse is a technically credible full-stack AI-assisted civic reporting platform. Its current implementation is well suited for a university Final Year Project demonstration and dissertation analysis. With targeted security hardening, deployment improvements, database indexing, and a more robust geospatial/AI pipeline, it could evolve toward a production-grade municipal road maintenance reporting system.
