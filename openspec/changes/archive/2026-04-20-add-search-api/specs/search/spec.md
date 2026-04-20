## ADDED Requirements

### Requirement: Full-text document search
The system SHALL expose `GET /api/v1/search?q=<term>` that searches ACTIVE documents by title (weight A), description (weight B), and tags (weight A) using PostgreSQL `tsvector` + `pg_trgm`. Results SHALL be ordered by `ts_rank` descending, then `createdAt` descending.

#### Scenario: Basic full-text search returns ranked results
- **WHEN** an authenticated user requests `GET /api/v1/search?q=passport`
- **THEN** the system returns 200 with `{ data: SearchResult[], total, page, limit, query }` containing only ACTIVE documents matching the term, ordered by rank

#### Scenario: Fuzzy match for typos
- **WHEN** a user searches for a term that doesn't exactly match but is within trigram similarity threshold (≥ 0.3) of a document title or description
- **THEN** the system returns the document in results (trigram index activates at 3+ character queries)

#### Scenario: Short query (1–2 chars) uses full-text only
- **WHEN** a user searches with a 1 or 2 character query
- **THEN** the system returns full-text matches only (no trigram fuzzy matching)

#### Scenario: Empty results return 200
- **WHEN** a search returns no matching documents
- **THEN** the system returns 200 with `{ data: [], total: 0, page: 1, limit: 20, query: "..." }`

#### Scenario: Query exceeding max length is rejected
- **WHEN** a user submits a query longer than 200 characters
- **THEN** the system returns 400

### Requirement: Permission-filtered search results
The system SHALL restrict search results to documents in folders where the requesting user has VIEW permission (resolved recursively up the folder tree). RESTRICTED documents SHALL only appear if the user's ID is in `allowedUserIds` or the user is ADMIN.

#### Scenario: USER only sees documents from accessible folders
- **WHEN** a USER searches and has VIEW permission on folders A and C but not B
- **THEN** results contain only documents from folders A, C, and their descendants

#### Scenario: ADMIN sees all ACTIVE documents
- **WHEN** an ADMIN searches
- **THEN** results include ACTIVE documents from all folders regardless of visibility or permission assignments

#### Scenario: RESTRICTED document hidden from non-allowlisted user
- **WHEN** a USER searches and a matching document has `visibility = RESTRICTED` and the user's ID is not in `allowedUserIds`
- **THEN** that document SHALL NOT appear in search results

#### Scenario: RESTRICTED document visible to allowlisted user
- **WHEN** a USER searches and a matching document has `visibility = RESTRICTED` and the user's ID IS in `allowedUserIds`
- **THEN** that document SHALL appear in search results

### Requirement: Tag filter
The system SHALL support `tags[]` query parameter that restricts results to documents containing ALL specified tags (array containment).

#### Scenario: Tag filter combined with full-text query
- **WHEN** a user requests `GET /api/v1/search?q=tax&tags[]=finance&tags[]=2023`
- **THEN** results contain only documents matching the query AND having both `finance` and `2023` in their tags array

#### Scenario: Tag filter with no query term is invalid
- **WHEN** a user requests `GET /api/v1/search?tags[]=finance` without a `q` parameter
- **THEN** the system returns 400 (q is required)

### Requirement: Folder scope filter
The system SHALL support `folderId` query parameter that restricts search to the specified folder and all its descendants.

#### Scenario: Search scoped to a folder subtree
- **WHEN** a user requests `GET /api/v1/search?q=report&folderId=<id>`
- **THEN** results contain only documents from the specified folder or any of its descendant folders (permission filtering still applies)

### Requirement: Pagination
The system SHALL support `page` and `limit` query parameters. Default page is 1, default limit is 20, maximum limit is 50.

#### Scenario: Second page returns correct slice
- **WHEN** a user requests `GET /api/v1/search?q=doc&page=2&limit=10`
- **THEN** the response contains the second page of 10 results and the correct `total` count

#### Scenario: Limit exceeding maximum is rejected
- **WHEN** a user requests `limit=51`
- **THEN** the system returns 400

### Requirement: Tag autocomplete
The system SHALL expose `GET /api/v1/search/tags?q=<prefix>` returning distinct tags from documents the requesting user can view, ordered by frequency descending.

#### Scenario: Prefix match returns ordered tags
- **WHEN** a user requests `GET /api/v1/search/tags?q=fin`
- **THEN** the system returns a JSON array of strings (e.g. `["finance", "final"]`) matching the prefix, ordered by usage frequency, limited to 20

#### Scenario: Unauthenticated request is rejected
- **WHEN** an unauthenticated request hits `GET /api/v1/search/tags`
- **THEN** the system returns 401

### Requirement: Search index maintained automatically
The system SHALL maintain a `searchVector` tsvector generated column on the `Document` table (title weight A, tags weight A, description weight B) backed by a GIN index. A `pg_trgm` extension and GIN indexes on `title` and `description` SHALL support fuzzy matching.

#### Scenario: Index updates on document metadata change
- **WHEN** a document's title, description, or tags are updated
- **THEN** `searchVector` is automatically recomputed by PostgreSQL (generated column) without application intervention
