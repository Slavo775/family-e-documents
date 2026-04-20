## 1. Configuration Files

- [x] 1.1 Populate `packages/ui/components.json` with shadcn init config (style: default, tailwind.config: tailwind.config.ts, aliases: @/components, @/lib/utils)
- [x] 1.2 Populate `packages/ui/tailwind.config.ts` with shadcn-compatible config (darkMode: "class", content globs, CSS variable theme extension)
- [x] 1.3 Verify `packages/ui/tsconfig.json` has `paths` entry `"@/*": ["./src/*"]`; add it if missing

## 2. Utility

- [x] 2.1 Populate `packages/ui/src/lib/utils.ts` with `cn()` helper (`clsx` + `tailwind-merge`)

## 3. Component Implementation

- [x] 3.1 Populate `packages/ui/src/components/ui/button.tsx` with shadcn Button component
- [x] 3.2 Populate `packages/ui/src/components/ui/input.tsx` with shadcn Input component
- [x] 3.3 Populate `packages/ui/src/components/ui/label.tsx` with shadcn Label component
- [x] 3.4 Populate `packages/ui/src/components/ui/card.tsx` with shadcn Card, CardHeader, CardContent, CardFooter components
- [x] 3.5 Populate `packages/ui/src/components/ui/form.tsx` with shadcn Form, FormField, FormItem, FormLabel, FormControl, FormMessage components
- [x] 3.6 Populate `packages/ui/src/components/ui/alert.tsx` with shadcn Alert, AlertTitle, AlertDescription components

## 4. Index Exports

- [x] 4.1 Populate `packages/ui/src/index.ts` to re-export all components from `./components/ui/*`

## 5. MCP Server

- [x] 5.1 Add shadcn MCP server entry to `.claude/settings.json` under `mcpServers` with `npx -y @shadcn/mcp --cwd packages/ui`

## 6. Verification

- [x] 6.1 Run `pnpm --filter @family-docs/ui typecheck` and confirm zero errors
