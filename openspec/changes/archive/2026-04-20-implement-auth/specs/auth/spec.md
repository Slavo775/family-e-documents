## MODIFIED Requirements

### Requirement: Login page uses shadcn components
The login page (`app/web/src/app/login/page.tsx`) SHALL use shadcn components from `@family-docs/ui` for all form elements: `Input` for email and password fields, `Label` for field labels, `Button` for the submit action, and `Card`/`CardHeader`/`CardContent` for the page container.

#### Scenario: Login page renders with shadcn components
- **WHEN** a user navigates to `/login`
- **THEN** the email field renders as a shadcn `Input` with type="email", the password field renders as a shadcn `Input` with type="password" and `autocomplete="current-password"`, and the submit renders as a shadcn `Button`

#### Scenario: Form is wrapped in Card
- **WHEN** a user views the login page
- **THEN** the form is contained within a shadcn `Card` component with the "Sign in" heading in `CardHeader`

### Requirement: Login form uses React Hook Form + Zod validation
The login form SHALL use React Hook Form with a Zod schema for client-side validation before submitting credentials. The schema SHALL require email to be a valid email address and password to be non-empty.

#### Scenario: Invalid email prevents submission
- **WHEN** a user enters "notanemail" in the email field and clicks Sign in
- **THEN** an inline validation error appears below the email field without making a network request

#### Scenario: Empty password prevents submission
- **WHEN** a user leaves the password field empty and clicks Sign in
- **THEN** an inline validation error appears below the password field without making a network request

#### Scenario: Valid input triggers sign-in call
- **WHEN** a user enters a valid email and non-empty password and clicks Sign in
- **THEN** `signIn('credentials', ...)` is called with the email and password values

### Requirement: Login error message does not leak credential details
The login page SHALL display the message "Invalid credentials" for any authentication failure regardless of whether the email was not found or the password was wrong.

#### Scenario: Wrong password shows generic error
- **WHEN** a user submits valid email with wrong password
- **THEN** the error message shown is exactly "Invalid credentials" — not "Wrong password" or "User not found"

#### Scenario: Unknown email shows generic error
- **WHEN** a user submits an email that does not exist
- **THEN** the error message shown is exactly "Invalid credentials"

### Requirement: Password field has correct autocomplete attribute
The password input on the login page SHALL have `autoComplete="current-password"` to support password managers and browser autofill.

#### Scenario: Password field is discoverable by password managers
- **WHEN** a browser or password manager inspects the login form
- **THEN** the password input has `autocomplete="current-password"` set
