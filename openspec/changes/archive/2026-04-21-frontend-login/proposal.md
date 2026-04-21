## Why

The current `app/web/src/app/login/page.tsx` is a minimal NextAuth sign-in page. The design template shows a polished login screen with a centered card, branded logo, email/password inputs with icons, show/hide password toggle, loading state, and styled error alerts. The existing page needs to be reworked to match this design while keeping the NextAuth credentials provider integration.

## What Changes

- Rework `app/login/page.tsx` to match the design template's login screen
- Centered card layout with `FamilyLogo` (from `frontend-app-shell`)
- Email input with Mail icon prefix
- Password input with Lock icon prefix and show/hide Eye toggle
- Full-width "Sign In" button with loading spinner state
- Styled error alert with AlertCircle icon
- "Forgot password?" link (placeholder) and footer text
- Wire form submission to NextAuth `signIn("credentials", ...)` with redirect to `/files`
- Use React Hook Form + Zod for validation

## Design Template References

| Design file | What it defines |
|---|---|
| `design-template-app/.../src/routes/login.tsx` | Full login page: centered card, FamilyLogo, email with Mail icon, password with Lock icon + Eye toggle, error alert, loading state, forgot password link |
| `design-template-app/.../src/components/family/logo.tsx` | FamilyLogo used in login header |

## Capabilities

### New Capabilities
- `frontend-login`: Polished login page matching design template with form validation and NextAuth integration

### Modified Capabilities
<!-- None — replaces existing placeholder login page -->

## Non-goals

- Forgot password / password reset flow (link is a placeholder)
- Registration / sign-up page
- OAuth / social login providers
- Remember me checkbox
- Rate limiting on login attempts (handled server-side)

## Impact

- `app/web/src/app/login/page.tsx`: complete rework to match design template
- Dependencies: `frontend-app-shell` (for FamilyLogo component)
