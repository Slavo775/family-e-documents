## ADDED Requirements

### Requirement: Users API is ADMIN-only
All endpoints under `/api/v1/users` SHALL require a valid Bearer token and ADMIN role. Requests without a valid token SHALL receive 401; requests with a non-ADMIN role SHALL receive 403.

#### Scenario: Unauthenticated request rejected
- **WHEN** a request is made to any `/api/v1/users` endpoint without a Bearer token
- **THEN** the API responds with 401 Unauthorized

#### Scenario: Non-admin request rejected
- **WHEN** a USER-role account makes a request to any `/api/v1/users` endpoint
- **THEN** the API responds with 403 Forbidden

### Requirement: List users
`GET /api/v1/users` SHALL return the full list of users as `UserPublic[]`.

#### Scenario: Admin lists all users
- **WHEN** an ADMIN sends `GET /api/v1/users`
- **THEN** the API responds with 200 and an array of `UserPublic` objects (never including `passwordHash`)

### Requirement: Get single user
`GET /api/v1/users/:id` SHALL return a single user by ID.

#### Scenario: User found
- **WHEN** an ADMIN sends `GET /api/v1/users/:id` with a valid user ID
- **THEN** the API responds with 200 and the `UserPublic` object

#### Scenario: User not found
- **WHEN** an ADMIN sends `GET /api/v1/users/:id` with an unknown ID
- **THEN** the API responds with 404 `{ message: "User not found" }`

### Requirement: Create user
`POST /api/v1/users` SHALL create a new user with a hashed password.

#### Scenario: User created successfully
- **WHEN** an ADMIN sends `POST /api/v1/users` with valid `CreateUserDto`
- **THEN** the API responds with 201 and the new `UserPublic` (password is hashed in DB, never returned)

#### Scenario: Email conflict
- **WHEN** an ADMIN sends `POST /api/v1/users` with an email already in use
- **THEN** the API responds with 409 `{ message: "Email already in use" }`

#### Scenario: Validation error
- **WHEN** an ADMIN sends `POST /api/v1/users` with an invalid email or password shorter than 8 characters
- **THEN** the API responds with 400 with validation error details

### Requirement: Update user
`PATCH /api/v1/users/:id` SHALL partially update a user's fields.

#### Scenario: User updated successfully
- **WHEN** an ADMIN sends `PATCH /api/v1/users/:id` with valid `UpdateUserDto`
- **THEN** the API responds with 200 and the updated `UserPublic`

#### Scenario: Password update triggers re-hash
- **WHEN** an ADMIN sends `PATCH /api/v1/users/:id` with a new `password` field
- **THEN** the password is hashed before storage and the plain-text value is never persisted

#### Scenario: Last ADMIN downgrade blocked
- **WHEN** an ADMIN sends `PATCH /api/v1/users/:id` to change the last ADMIN's role to USER
- **THEN** the API responds with 400 `{ message: "Cannot downgrade the last admin" }`

### Requirement: Delete user
`DELETE /api/v1/users/:id` SHALL delete a user and transfer document ownership.

#### Scenario: User deleted successfully
- **WHEN** an ADMIN sends `DELETE /api/v1/users/:id` for a non-last-admin user
- **THEN** the API responds with 204; the user's sessions and folder permissions are cascade-deleted; their uploaded documents are reassigned to the deleting admin; their ID is removed from all document `allowedUserIds`

#### Scenario: Self-delete blocked
- **WHEN** an ADMIN sends `DELETE /api/v1/users/:id` for their own account
- **THEN** the API responds with 400 `{ message: "Cannot delete your own account" }`

#### Scenario: Last ADMIN delete blocked
- **WHEN** an ADMIN sends `DELETE /api/v1/users/:id` and the target is the only remaining ADMIN
- **THEN** the API responds with 400 `{ message: "Cannot delete the last admin" }`

#### Scenario: User not found on delete
- **WHEN** an ADMIN sends `DELETE /api/v1/users/:id` with an unknown ID
- **THEN** the API responds with 404 `{ message: "User not found" }`

### Requirement: UserPublic type includes createdAt
The `UserPublic` interface in `packages/types` SHALL include a `createdAt: string` field.

#### Scenario: createdAt present in response
- **WHEN** any Users API endpoint returns a `UserPublic` object
- **THEN** the object includes a `createdAt` field as an ISO 8601 UTC string
