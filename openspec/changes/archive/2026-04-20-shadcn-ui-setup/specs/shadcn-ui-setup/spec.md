## ADDED Requirements

### Requirement: shadcn/ui initialized in packages/ui
The `packages/ui` package SHALL have a valid `components.json` at its root, configured with the `default` style, Tailwind CSS, and the `@` path alias pointing to `src/`.

#### Scenario: components.json exists with correct config
- **WHEN** a developer inspects `packages/ui/components.json`
- **THEN** the file exists with `style: "default"`, `tailwind.config` pointing to `tailwind.config.ts`, and `aliases.components` set to `@/components`

### Requirement: cn utility available
`packages/ui` SHALL provide a `cn()` helper at `src/lib/utils.ts` that combines `clsx` and `tailwind-merge` for conditional class merging.

#### Scenario: cn helper importable
- **WHEN** a component in `packages/ui` imports `{ cn } from "@/lib/utils"`
- **THEN** TypeScript resolves the import without error and the function merges class strings correctly

### Requirement: Base component set in packages/ui
`packages/ui` SHALL contain the following shadcn components as source files under `src/components/ui/`: Button (replacing the existing empty stub), Input, Label, Card (with CardHeader, CardContent, CardFooter), Form (with FormField, FormItem, FormLabel, FormControl, FormMessage), and Alert (with AlertTitle, AlertDescription).

#### Scenario: Components importable from @family-docs/ui
- **WHEN** a consuming app imports `{ Input, Label, Card, Form, Alert } from '@family-docs/ui'`
- **THEN** TypeScript resolves the types without error and the components render correctly

#### Scenario: Existing Button export preserved
- **WHEN** a consuming app imports `{ Button } from '@family-docs/ui'`
- **THEN** the Button resolves to the shadcn-generated Button and existing usages continue to compile

### Requirement: packages/ui index exports all base components
`packages/ui/src/index.ts` SHALL re-export all base shadcn components so consumers never import from deep paths.

#### Scenario: No deep path imports needed
- **WHEN** a developer adds a new component usage in `app/web`
- **THEN** the import comes from `@family-docs/ui`, not `@family-docs/ui/src/components/ui/button`

### Requirement: shadcn MCP server configured for packages/ui
The project's Claude Code settings SHALL include an MCP server entry that runs the `@shadcn/mcp` server pointed at `packages/ui`, enabling registry-based component generation.

#### Scenario: MCP server entry exists in settings
- **WHEN** a developer opens `.claude/settings.json`
- **THEN** there is an entry under `mcpServers` with a command that runs the shadcn MCP server with `--cwd packages/ui`
