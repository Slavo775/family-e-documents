## ADDED Requirements

### Requirement: StorageService interface
`app/api` SHALL define a `StorageService` TypeScript interface with four methods: `createUploadUrl`, `createDownloadUrl`, `deleteObject`, and `objectExists`. All business logic SHALL depend on this interface, not the concrete implementation.

#### Scenario: Interface is the injection contract
- **WHEN** a NestJS service injects storage via `@Inject('STORAGE_SERVICE')`
- **THEN** it receives an object implementing the `StorageService` interface with all four methods available

### Requirement: S3StorageService implementation
`app/api` SHALL provide `S3StorageService` implementing `StorageService` using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.

#### Scenario: Presigned upload URL generated
- **WHEN** `createUploadUrl` is called with a `documentId`, `mimeType`, and `sizeBytes`
- **THEN** it returns `{ objectKey, uploadUrl, expiresAt }` where `uploadUrl` is a valid S3 presigned PUT URL expiring after `UPLOAD_URL_TTL_SECONDS` (default 900s) and `objectKey` follows the pattern `documents/{documentId}/{filename}`

#### Scenario: Presigned download URL generated
- **WHEN** `createDownloadUrl` is called with an `objectKey` and `filename`
- **THEN** it returns `{ downloadUrl, expiresAt }` where `downloadUrl` is a valid S3 presigned GET URL with `Content-Disposition: attachment; filename="{filename}"` and TTL of `DOWNLOAD_URL_TTL_SECONDS` (default 3600s)

#### Scenario: Object deleted
- **WHEN** `deleteObject` is called with an `objectKey`
- **THEN** the corresponding S3 object is permanently deleted; if deletion fails it is logged but does not throw

#### Scenario: Object existence checked
- **WHEN** `objectExists` is called with an `objectKey` after a successful S3 PUT
- **THEN** it returns `true`

#### Scenario: Object non-existence detected
- **WHEN** `objectExists` is called with an `objectKey` that has never been uploaded
- **THEN** it returns `false`

### Requirement: StorageModule NestJS wiring
`app/api` SHALL provide a `StorageModule` that exports `S3StorageService` bound to the `'STORAGE_SERVICE'` injection token, configured via `ConfigService`.

#### Scenario: Module imported by AppModule
- **WHEN** `StorageModule` is imported into `AppModule`
- **THEN** any module that imports `StorageModule` can inject the `StorageService` via `@Inject('STORAGE_SERVICE')`

### Requirement: Environment-driven S3 configuration
`S3StorageService` SHALL read all AWS credentials and bucket config from environment variables via `ConfigService`. A local development override SHALL be supported via `S3_ENDPOINT`.

#### Scenario: MinIO used in local development
- **WHEN** `S3_ENDPOINT` is set to `http://localhost:9000`
- **THEN** `S3StorageService` connects to MinIO using path-style addressing and the same presigned URL logic as production

#### Scenario: Missing required config at startup
- **WHEN** `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, or `AWS_SECRET_ACCESS_KEY` is absent
- **THEN** the application fails to start with a descriptive configuration error

### Requirement: MIME type allowlist enforced before upload URL generation
`S3StorageService.createUploadUrl` SHALL reject requests whose `mimeType` is not in the allowed set (PDF, DOCX, XLSX, PPTX, ODT, ODS, ODP, JPEG, PNG, WebP, GIF, plain text, CSV).

#### Scenario: Allowed MIME type accepted
- **WHEN** `createUploadUrl` is called with `mimeType: "application/pdf"`
- **THEN** a presigned upload URL is returned

#### Scenario: Disallowed MIME type rejected
- **WHEN** `createUploadUrl` is called with `mimeType: "application/x-executable"`
- **THEN** an error is thrown and no S3 request is made

### Requirement: File size limit enforced via presigned URL conditions
Upload presigned URLs SHALL include S3 conditions that reject objects larger than 500 MB.

#### Scenario: Large file blocked at S3
- **WHEN** a browser PUTs a file exceeding 500 MB to the presigned upload URL
- **THEN** S3 rejects the request with a 4xx error before the object is stored

### Requirement: MinIO available in local development
`docker-compose.yml` SHALL include a MinIO service accessible at port 9000 (API) and 9001 (console) with default credentials for local development.

#### Scenario: MinIO starts with docker-compose
- **WHEN** a developer runs `docker-compose up`
- **THEN** MinIO is available at `http://localhost:9000` and the console at `http://localhost:9001`
