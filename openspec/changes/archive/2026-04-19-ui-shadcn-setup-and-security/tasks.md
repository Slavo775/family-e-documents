## 1. shadcn/ui Setup in packages/ui

- [x] 1.1 Add shadcn CLI and required peer deps (`@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`) to `packages/ui/package.json`
- [x] 1.2 Run `npx shadcn@latest init --cwd packages/ui` and commit the generated `components.json` (style: default, Tailwind enabled, alias `@` → `src/`)
- [x] 1.3 Verify `packages/ui/tailwind.config.ts` and `postcss.config.cjs` exist and are correct
- [x] 1.4 Add shadcn MCP server entry to `.claude/settings.json` under `mcpServers` pointing at `npx @shadcn/mcp --cwd packages/ui`

## 2. Base Components in packages/ui

- [x] 2.1 Add `input` component via shadcn CLI (`npx shadcn@latest add input --cwd packages/ui`)
- [x] 2.2 Add `label` component via shadcn CLI
- [x] 2.3 Add `card` component via shadcn CLI
- [x] 2.4 Add `form` component via shadcn CLI (installs React Hook Form integration)
- [x] 2.5 Add `alert` component via shadcn CLI
- [x] 2.6 Replace hand-rolled `src/components/button.tsx` with shadcn-generated version (run `npx shadcn@latest add button --cwd packages/ui --overwrite`)
- [x] 2.7 Update `packages/ui/src/index.ts` to export Input, Label, Card, CardHeader, CardContent, CardFooter, Form, FormField, FormItem, FormLabel, FormControl, FormMessage, Alert, AlertDescription, AlertTitle alongside existing Button and cn exports

## 3. Login Page — shadcn Components + Security

- [x] 3.1 Install `react-hook-form` and `zod` in `app/web` if not already present (check `package.json`)
- [x] 3.2 Rewrite `app/web/src/app/login/page.tsx` to use Card/CardHeader/CardContent for layout
- [x] 3.3 Replace raw `<input>` elements with shadcn `Input` + `Label` wrapped in `FormField`/`FormItem`/`FormControl`/`FormMessage`
- [x] 3.4 Add Zod schema for login form (email: valid email, password: non-empty string) and wire to `useForm`
- [x] 3.5 Add `autoComplete="current-password"` to the password `Input`
- [x] 3.6 Ensure error message is always exactly "Invalid credentials" regardless of the error type returned by `signIn`
- [x] 3.7 Display auth error using shadcn `Alert` (destructive variant) instead of a plain `<p>` tag

## 4. Error Boundaries in app/web

- [x] 4.1 Create `app/web/src/app/global-error.tsx` — root layout error boundary using shadcn Alert + Button, calling `console.error(error)` and exposing a `reset()` button
- [x] 4.2 Create `app/web/src/app/error.tsx` — route-level error boundary with the same structure but scoped to segments, wrapping the app shell

## 5. ESLint Unification

- [x] 5.1 Audit `packages/config-eslint/base.js` — add `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url` as errors if not present
- [x] 5.2 Verify `app/web` has an ESLint config that extends `@family-docs/config-eslint/nextjs`; create or fix it if missing
- [x] 5.3 Verify `app/api` has an ESLint config that extends `@family-docs/config-eslint/base`; create or fix it if missing
- [x] 5.4 Verify `packages/ui` has an ESLint config extending `@family-docs/config-eslint/base`; create or fix it if missing
- [x] 5.5 Verify `packages/types` has an ESLint config extending `@family-docs/config-eslint/base`; create or fix it if missing
- [x] 5.6 Ensure every workspace `package.json` has a `"lint"` script
- [x] 5.7 Run `pnpm --filter "*" lint` from monorepo root and fix all errors (warnings acceptable)

## 6. Verification

- [x] 6.1 Run `pnpm --filter "@family-docs/ui" build` — confirm no TypeScript errors in the ui package
- [ ] 6.2 Run `pnpm --filter "web" dev` — confirm login page renders correctly with shadcn components
- [ ] 6.3 Test login form: submit empty fields → inline validation errors shown, no network request made
- [ ] 6.4 Test login form: submit wrong credentials → "Invalid credentials" alert shown
- [ ] 6.5 Test login form: submit valid credentials → redirect to `/dashboard`
- [ ] 6.6 Trigger a runtime error in a page component and confirm `error.tsx` renders with reset button
- [x] 6.7 Run `pnpm --filter "*" lint` — confirm 0 errors across all workspaces
