## Context

The existing `app/login/page.tsx` uses NextAuth's `signIn()` function with the credentials provider configured in `lib/auth.ts`. The design template's login page at `design-template-app/.../src/routes/login.tsx` shows the exact visual layout to reproduce. The `FamilyLogo` component will be available from `frontend-app-shell` change.

shadcn components available: Button, Input, Label, Card, Alert. Additional needed: none (error display uses custom styled div, not the Alert component).

## Goals / Non-Goals

**Goals:**
- Exact visual match to design template login page
- Real NextAuth integration (not mock submission)
- Form validation with Zod (email format, password min length)
- Accessible: proper labels, aria attributes, keyboard navigation

**Non-Goals:**
- Forgot password flow
- Sign-up page
- Session persistence options

## Decisions

### Decision: React Hook Form + Zod for validation

Use `react-hook-form` with `@hookform/resolvers/zod` for client-side validation. Schema: email (valid email format), password (min 8 chars). This matches the project's tech stack conventions.

### Decision: NextAuth signIn with redirect: false

Call `signIn("credentials", { email, password, redirect: false })` to handle errors client-side (show error alert) rather than redirecting to NextAuth's default error page. On success, use `router.push("/files")`.

### Decision: Custom error display, not shadcn Alert

The design template uses a custom inline error div with `AlertCircle` icon and destructive colors. Reproduce this exactly rather than using the shadcn Alert component, to match the design pixel-for-pixel.

## Risks / Trade-offs

- **FamilyLogo dependency** — this change depends on `frontend-app-shell` being completed first (for the logo component). If implementing in parallel, the logo can be stubbed initially.

## Migration Plan

1. Install react-hook-form and @hookform/resolvers if not present
2. Create Zod login schema
3. Rework login page layout (centered card, logo, inputs with icons)
4. Wire form to NextAuth signIn
5. Add error display and loading states
