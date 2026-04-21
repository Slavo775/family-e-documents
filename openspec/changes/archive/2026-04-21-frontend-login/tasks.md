## 1. Dependencies

- [x] 1.1 Ensure `react-hook-form`, `@hookform/resolvers`, and `zod` are installed in `app/web`

## 2. Login Page Rework

- [x] 2.1 Create Zod schema for login form: `email` (valid email), `password` (min 8 chars) in `app/web/src/lib/validations/login.ts`
- [x] 2.2 Rework `app/web/src/app/login/page.tsx` to match design template (`design-template-app/.../src/routes/login.tsx`):
  - Centered full-screen layout with `bg-surface`
  - Max-width 400px card with border, shadow
  - `FamilyLogo` (from `components/family/family-logo.tsx`) centered with "Sign in to your account" subtitle
  - Email input with `Mail` lucide icon prefix, `pl-9`
  - Password input with `Lock` icon prefix and `Eye`/`EyeOff` toggle button
  - Full-width "Sign In" / "Signing in..." button with disabled state
  - Error alert: flex row with `AlertCircle` icon, destructive colors, rounded-md
  - "Forgot password?" link (href="#", placeholder)
  - Footer: "Family Docs — Private & Secure"
- [x] 2.3 Wire form submission to `signIn("credentials", { email, password, redirect: false })`, handle errors (show error alert), redirect to `/files` on success using `useRouter().push()`

## 3. Verification

- [x] 3.1 Run typecheck and confirm zero errors
