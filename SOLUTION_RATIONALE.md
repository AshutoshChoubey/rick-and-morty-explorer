# Architecture & Solution Rationale: Rick & Morty Explorer

This document details the architectural decisions, design patterns, state management strategies, and performance considerations applied throughout the **Rick & Morty Character Explorer** application.

---

## 1. Architecture & Technology Stack

### 1.1 Angular 19 Standalone Architecture
- **Standalone Components & Dependency Injection:** The application completely bypasses legacy `NgModule` declarations. Components, directives, and pipes are standalone, resulting in a direct, tree-shakeable dependency graph. Dependencies are injected via Angular's functional `inject()` API.
- **Modern Control Flow (`@if`, `@for`, `@else`):** Templates utilize Angular's native control flow syntax, reducing runtime overhead and improving type narrowing compared to structural directives (`*ngIf`, `*ngFor`).

### 1.2 NgRx 19 State Management (`@ngrx/store`, `@ngrx/effects`)
The application implements centralized state management with three dedicated feature slices:

1. **`characters` slice:**
   - **State:** `characters: Character[]`, `totalCharacters: number`, `totalPages: number`, `currentPage: number`, `searchQuery: string`, `viewMode: ViewMode`, `selectedCharacterId: number | null`, `loading: boolean`, `error: string | null`.
   - **Effects (`CharactersEffects`):**
     - `loadCharacters$`: Listens to `loadCharacters` action and calls `RickAndMortyService.getCharacters(page, name)` using `switchMap` to cancel pending HTTP calls.
     - `searchCharacters$`: Listens to `setSearchQuery`, applies `debounceTime(350)` and `distinctUntilChanged()`, and triggers `loadCharacters` on page 1.
     - `changePage$`: Listens to `setPage`, combines with `selectSearchQuery` via `withLatestFrom`, and triggers `loadCharacters`.
   - **Selectors:** Memoized selectors providing instant signal projection into templates via `this.store.selectSignal(...)`.

2. **`characterDetail` slice:**
   - **State:** `character: Character | null`, `episodes: Episode[]`, `episodeFilter: string`, `sortBy: 'name' | 'air_date' | 'episode'`, `sortAsc: boolean`, `loadingCharacter: boolean`, `loadingEpisodes: boolean`, `error: string | null`.
   - **Effects (`CharacterDetailEffects`):**
     - `loadCharacterDetail$`: Fetches character by ID using `switchMap`.
     - `loadEpisodesTrigger$`: Automatically fires when character details resolve successfully, dispatching `loadEpisodes({ character })`.
     - `loadEpisodes$`: Performs batch episode resolution via `RickAndMortyService.getCharacterEpisodes(character)` in a single HTTP call.
   - **Selector `selectFilteredEpisodes`:** Performs in-store memoized filtering and multi-column sorting. The UI component simply binds to the selector signal, ensuring complete separation of business logic and view rendering.

3. **`role` slice:**
   - **State:** `currentRole: UserRole` (`'ADMIN'` | `'VIEWER'`), `accessDeniedNotice: AccessDeniedNotice | null`.
   - **Effects (`RoleEffects`):** Persists role updates to `localStorage` for session durability.
   - **Role Guard (`roleGuard`):** Functional `CanActivateFn` that subscribes to `selectCanAccessDetails` using `take(1)`. If access is forbidden, it dispatches `RoleActions.notifyAccessDenied` and generates a redirect `UrlTree` to `/access-denied`.

### 1.3 Reactive Stream Orchestration (RxJS)
RxJS operators are strategically deployed throughout the data and event pipelines:
- **`switchMap`:** Discards superseded in-flight requests when a user continues typing or switches pages rapidly.
- **`debounceTime(350ms)` & `distinctUntilChanged()`:** Applied both at the effect level and user input layer to prevent query churn and duplicate API invocations.
- **`withLatestFrom`:** Safely reads the active search term when pagination actions are dispatched.
- **`catchError`:** Intercepts failures, converting API errors (such as 404 for empty search queries) into well-typed, normalized states.
- **`take(1)` & `map`:** Used in route guards and initialization pipelines to execute single-emission checks without leaving orphaned subscriptions.

### 1.4 Component Library: Angular Material 19 & Utility Styling
- **Angular Material (`@angular/material`, `@angular/cdk`):**
  - **`MatTableModule`:** Implemented for both the List View in the character directory and the Episode Appearances table on the character details view.
  - **`MatButtonModule` & `MatButtonToggleModule`:** Powers the primary actions and the Grid vs. List view switcher.
  - **`MatCardModule` & `MatChipsModule`:** Drives character cards, status overlays, and identity trait chips.
  - **`MatProgressSpinnerModule`:** Provides visual feedback during data fetching.
  - **`MatIconModule`:** Renders Material navigation and status icons.
- **High-Contrast Input Containers:** Custom-crafted 48px search containers with internal Material icons and clear buttons, styled to prevent dark-theme clipping issues common to standard Material outlined inputs.
- **Tailwind CSS:** Provides atomic utility classes for responsive layouts, flexboxes, and dark obsidian themes.

---

## 2. Requirement Implementation Details

### 2.1 Home Page: Grid/List View & Character Metadata
- **View Toggle:** Persistent toggle between `grid` and `list` modes saved in NgRx state.
- **Table Implementation:** In list mode, characters render in an Angular Material `mat-table` with dedicated columns (`avatar`, `name`, `status`, `species`, `gender`, `episodes`, `action`).
- **Metadata Display:** Name, status (with animated alive/dead indicator), species, gender, and total calculated episodes are prominently visible in both layouts.

### 2.2 Navigation State Preservation
- **Preserved Attributes:** Active page number, search term, view mode, and selected character ID are preserved in the NgRx Store (`characters` slice).
- **Navigation Feedback:** Navigating to a character detail and clicking "Back to Character Directory" maintains the user's exact pagination position and search state, with the previously selected character card or table row highlighted.

### 2.3 Character Search
- **API 404 Normalization:** The Rick and Morty API responds with `404 Not Found` (`{ error: "There is nothing here" }`) when a search query yields no results. `RickAndMortyService` catches 404s via `catchError` and normalizes them into `{ info: { count: 0, pages: 0 }, results: [] }`, enabling a clean, informative "No characters found" UI without throwing unhandled exceptions.

### 2.4 Character Details & Batch Episode Resolution
- **Route:** `/character/:id` guarded by `roleGuard`.
- **Single-Request Batching:** Rather than querying individual episode endpoints sequentially (`/api/episode/1`, `/api/episode/2`, etc.), numeric IDs are extracted from the character's URL list and fetched as a single comma-separated batch:
  ```
  https://rickandmortyapi.com/api/episode/1,2,3...
  ```
  This reduces $N$ network round-trips to a single request ($O(1)$ HTTP connections).
- **Client-Side Free-Form Search:** The episode filter is debounced and evaluated via the `selectFilteredEpisodes` selector.
- **Column Sorting:** Multi-directional sorting on `name`, `air_date`, and `episode`.

### 2.5 Role-Based Authorization
- **Roles:** `Admin` (unrestricted) and `Viewer` (character list only).
- **Route Guard:** `roleGuard` dynamically queries `selectCanAccessDetails` from the NgRx Store. If a Viewer attempts to access `/character/:id`:
  1. The attempt is blocked.
  2. `RoleActions.notifyAccessDenied` is dispatched with the attempted URL.
  3. The user is redirected to `/access-denied?attempted=...`.
- **Feedback & Recovery:** The `/access-denied` page renders an HTTP 403 Forbidden state with explanatory text and a 1-click action to switch the session to Admin and retry the route.

---

## 3. Cloudflare Pages Hosting Configuration

The project is configured for seamless deployment on **Cloudflare Pages**:
- **Build Output Directory:** `dist/rick-and-morty-explorer/browser`
- **Build Command:** `npm run build`
- **SPA Routing (`_redirects`):** `public/_redirects` contains:
  ```
  /*    /index.html   200
  ```
  The Angular CLI build pipeline includes this file in the distribution root, allowing direct access and browser refreshes on routes like `/character/1` and `/access-denied` without HTTP 404 errors.
- **Security & Performance Headers (`_headers`):** Pre-configured with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and cache control policies.

---

## 4. Test Coverage & Verification

- **23 Automated Unit Tests:**
  - `RickAndMortyService`: Pagination, name search queries, 404 error normalization, ID extraction, single episode vs. batch episode resolution.
  - `RoleService`: Default role assignment, switching to Viewer, role toggling, access denied notifications.
  - `roleGuard`: Permission granting for Admin, route blocking and redirect creation for Viewer.
  - `CharacterListComponent`: Store initialization, grid/list view mode switching, debounced search timing (`fakeAsync`, `tick`), Admin navigation, Viewer access restriction.
  - `CharacterDetailComponent`: Effects-driven character and episode loading, debounced client-side episode filtering, multi-column sorting.
  - `AppComponent`: Root bootstrapping and component wiring.
