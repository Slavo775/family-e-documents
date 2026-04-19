## ADDED Requirements

### Requirement: Root-level error boundary in app/web
`app/web/src/app/global-error.tsx` SHALL exist and render a minimal full-page fallback UI when a layout-level React error is caught. It SHALL call `console.error(error)` with the caught error.

#### Scenario: Layout-level crash is caught
- **WHEN** an unhandled error is thrown inside the root layout
- **THEN** `global-error.tsx` renders instead of a blank page, and the error is logged via `console.error`

#### Scenario: Fallback UI provides a recovery action
- **WHEN** `global-error.tsx` is displayed
- **THEN** a "Try again" button is visible that calls `reset()` to attempt re-rendering

### Requirement: Route-level error boundary in app/web
`app/web/src/app/error.tsx` SHALL exist and render a route-scoped fallback UI when a segment-level React error is caught. It SHALL call `console.error(error)` with the caught error.

#### Scenario: Route-level crash is caught
- **WHEN** an unhandled error is thrown inside a route segment (e.g., dashboard)
- **THEN** `error.tsx` renders in place of that segment, the shell layout remains visible, and the error is logged via `console.error`

#### Scenario: Fallback UI provides a recovery action
- **WHEN** `error.tsx` is displayed
- **THEN** a "Try again" button calls `reset()` to retry rendering the segment

### Requirement: Error boundary components use shadcn ui
Both `global-error.tsx` and `error.tsx` SHALL use shadcn Alert and Button components from `@family-docs/ui` for their fallback UI.

#### Scenario: Error boundary renders shadcn components
- **WHEN** an error boundary is triggered
- **THEN** the rendered fallback contains a shadcn Alert (destructive variant) and a shadcn Button for the reset action
