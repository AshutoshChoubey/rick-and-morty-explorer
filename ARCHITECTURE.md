# Architectural Guide & Technical Deep-Dive

This document provides a comprehensive architectural breakdown of the **Rick & Morty Character Explorer** application. It details the design rationale, framework primitives, state machine topology, reactive pipelines, and testing harnesses.

---

## Table of Contents
1. [Project Overview & Architecture Principles](#1-project-overview--architecture-principles)
2. [Build Pipeline & Configuration (`angular.json`)](#2-build-pipeline--configuration-angularjson)
3. [Bootstrapping Architecture (`main.ts` & `app.config.ts`)](#3-bootstrapping-architecture-maints--appconfigts)
4. [Routing & Functional Guard Architecture (`app.routes.ts` & `role.guard.ts`)](#4-routing--functional-guard-architecture-approutest--roleguardts)
5. [Feature Architecture: Character List (`character-list.component.ts`)](#5-feature-architecture-character-list-character-listcomponentts)
6. [Feature Architecture: Character Detail (`character-detail.component.ts`)](#6-feature-architecture-character-detail-character-detailcomponentts)
7. [Core Layer: Services, Models, and Mock Data](#7-core-layer-services-models-and-mock-data)
8. [NgRx Reactive State Machine Deep-Dive](#8-ngrx-reactive-state-machine-deep-dive)
9. [Testing Harness: Jasmine Unit Tests & Playwright E2E Suite](#9-testing-harness-jasmine-unit-tests--playwright-e2e-suite)

---

## 1. Project Overview & Architecture Principles

The application is engineered around four core tenets:
- **Unidirectional Data Flow:** All state mutations originate as strongly typed actions dispatched to the NgRx Store.
- **Side-Effect Isolation:** Components never perform direct HTTP calls. All asynchronous I/O and API communications are encapsulated inside `@ngrx/effects`.
- **Hybrid Signal-Store Reactivity:** State slices are consumed via `store.selectSignal()`, providing fine-grained signal reactivity in templates while preserving an enterprise-grade Redux state machine.
- **Defensive Design:** Network timeouts, CORS quirks on 404 responses, and role authorization barriers are handled gracefully with deterministic fallback states.

---

## 2. Build Pipeline & Configuration (`angular.json`)

The application configuration in `angular.json` relies on the modern `@angular-devkit/build-angular:application` builder introduced in Angular 17+:

```json
"builder": "@angular-devkit/build-angular:application",
"options": {
  "outputPath": "dist/rick-and-morty-explorer",
  "index": "src/index.html",
  "browser": "src/main.ts",
  "polyfills": ["zone.js"],
  "tsConfig": "tsconfig.app.json",
  "inlineStyleLanguage": "scss",
  "assets": [
    {
      "glob": "**/*",
      "input": "public"
    }
  ],
  "styles": [
    "@angular/material/prebuilt-themes/azure-blue.css",
    "src/styles.scss"
  ]
}
```

### Key Build Highlights:
1. **Application Builder (esbuild + Vite):**
   - Replaces legacy Webpack with `esbuild` for fast production bundle creation.
   - Emits optimized ES modules with tree-shaking, code-splitting, and differential chunking.
   - Employs a Vite-powered development server for instant hot module reloading (HMR).
2. **Asset Pipeline & Cloudflare Pages Integration:**
   - The `"assets"` configuration maps `public/` into the root of `dist/rick-and-morty-explorer/browser/`.
   - Copies `_redirects` (`/* /index.html 200`) and `_headers` (CORS and security headers) directly into the deployment bundle, ensuring seamless client-side single-page application (SPA) routing on Cloudflare Pages.
3. **Style Compilation:**
   - Bundles `@angular/material` azure-blue theme alongside Tailwind CSS (`src/styles.scss`).

---

## 3. Bootstrapping Architecture (`main.ts` & `app.config.ts`)

### `main.ts`
The application uses the modern standalone bootstrapping API:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
```

- **Zero NgModules:** Eliminates legacy `@NgModule` declarations.
- **Root Context:** Directly binds `AppComponent` to the DOM and supplies provider tokens defined in `appConfig`.

### `app.config.ts`
Contains global providers configured using functional provider functions:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    provideStore({
      characters: charactersReducer,
      characterDetail: characterDetailReducer,
      role: roleReducer
    }),
    provideEffects([CharactersEffects, CharacterDetailEffects, RoleEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode()
    })
  ]
};
```

- **`withFetch()`:** Uses the browser native `fetch` API under `HttpClient` for enhanced streaming and worker compatibility.
- **`withComponentInputBinding()`:** Enables route parameters (`:id`) to bind automatically into component `@Input` properties if desired.
- **`provideStore` & `provideEffects`:** Registers the root state reducer map and side-effect classes.
- **`provideAnimationsAsync`:** Loads Angular Material animations asynchronously to minimize initial bundle footprint.

---

## 4. Routing & Functional Guard Architecture (`app.routes.ts` & `role.guard.ts`)

### Route Definitions (`app.routes.ts`)

```typescript
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/character-list/character-list.component').then(
        (m) => m.CharacterListComponent
      )
  },
  {
    path: 'character/:id',
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./features/character-detail/character-detail.component').then(
        (m) => m.CharacterDetailComponent
      )
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./features/access-denied/access-denied.component').then(
        (m) => m.AccessDeniedComponent
      )
  },
  {
    path: '**',
    redirectTo: ''
  }
];
```

- **Lazy Component Resolution:** `loadComponent` uses dynamic imports to ensure routes are only loaded when navigated to.
- **Wildcard Catch-All:** `path: '**'` gracefully routes unrecognized URLs back to the home directory.

### Functional Guard (`role.guard.ts`)

```typescript
export const roleGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectCanAccessDetails).pipe(
    take(1),
    map((canAccess) => {
      if (canAccess) {
        return true;
      }

      store.dispatch(
        RoleActions.notifyAccessDenied({ targetRoute: state.url })
      );

      return router.createUrlTree(['/access-denied'], {
        queryParams: { attempted: state.url }
      });
    })
  );
};
```

### Guard Rationale:
1. **Functional `CanActivateFn`:** Replaces deprecated class-based guards (`implements CanActivate`). Uses Angular's `inject()` to obtain `Store` and `Router` tokens.
2. **Store-Driven Verification:** Checks `selectCanAccessDetails` directly from the NgRx state slice.
3. **`take(1)` Stream Completion:** Automatically un-subscribes after emitting the first authorization state, preventing memory leaks and router stalls.
4. **`UrlTree` Redirection:** Returns `router.createUrlTree(['/access-denied'], { queryParams: { attempted: state.url } })`, cleanly aborting the unauthorized transition while preserving the attempted path for the 1-click promotion unlock button.

---

## 5. Feature Architecture: Character List (`character-list.component.ts`)

### Inline Template Rationale:
The component uses an inline `template` within the `@Component` decorator. This pattern provides:
- Single-point-of-maintenance: view logic, signals, and template directives stay contiguous.
- Zero path-resolution overhead between `.ts` and `.html`.

### Dependency Injection (`inject`):
```typescript
private readonly store = inject(Store);
private readonly router = inject(Router);
```
- Modern functional DI replacing verbose constructor injection (`constructor(private store: Store)`).
- Works cleanly with inheritance and standalone components.

### Immutability via `readonly`:
```typescript
readonly characters = this.store.selectSignal(selectAllCharacters);
readonly totalCharacters = this.store.selectSignal(selectTotalCharacters);
readonly totalPages = this.store.selectSignal(selectTotalPages);
readonly currentPage = this.store.selectSignal(selectCurrentPage);
readonly searchQuery = this.store.selectSignal(selectSearchQuery);
readonly viewMode = this.store.selectSignal(selectViewMode);
readonly selectedCharacterId = this.store.selectSignal(selectSelectedCharacterId);
readonly loading = this.store.selectSignal(selectCharactersLoading);
```
- Marking properties `readonly` guarantees they cannot be reassigned at runtime by member methods.
- Prevents accidental mutations of signal references and DI instances.

### View Modes & Angular Material Table:
- **Grid View:** Interactive cards displaying character portrait, status pulse indicator, origin, and total episode count.
- **List View:** High-density `mat-table` with explicit column definitions:
  `['avatar', 'name', 'status', 'species', 'gender', 'episodes', 'action']`.

### Search & Debouncing:
Keystrokes trigger `onSearchInput(value)`, dispatching `setSearchQuery({ query })`. The NgRx effect pipeline debounces the input by 350ms before firing `loadCharacters`. When the user clears the search filter, `clearSearch()` immediately dispatches `loadCharacters({ page: 1, name: '' })` for instant feedback.

---

## 6. Feature Architecture: Character Detail (`character-detail.component.ts`)

### Route Parameter Watching:
```typescript
this.routeParamSub = this.route.paramMap
  .pipe(
    map((params) => params.get('id')),
    distinctUntilChanged(),
    filter((id): id is string => !!id)
  )
  .subscribe((id) => {
    this.store.dispatch(CharacterActions.setSelectedCharacterId({ id: Number(id) }));
    this.store.dispatch(DetailActions.loadCharacterDetail({ id }));
  });
```
Watches for route parameter changes (`/character/:id`) and dispatches `loadCharacterDetail`.

### In-Memory Free-Form Episode Filtering & Sorting:
- User queries are pushed to a `Subject<string>`.
- Debounced by `250ms` using `debounceTime` and `distinctUntilChanged()`.
- Dispatches `setEpisodeFilter({ term })`.
- Handled inside the memoized selector `selectFilteredEpisodes`:
  ```typescript
  export const selectFilteredEpisodes = createSelector(
    selectEpisodes,
    selectEpisodeFilter,
    selectSortBy,
    selectSortAsc,
    (episodes, filterTerm, sortBy, sortAsc) => {
      const term = (filterTerm || '').trim().toLowerCase();
      let result = episodes;
      if (term) {
        result = result.filter((ep) => ep.name.toLowerCase().includes(term));
      }
      const dir = sortAsc ? 1 : -1;
      return [...result].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name) * dir;
        if (sortBy === 'air_date') return a.air_date.localeCompare(b.air_date) * dir;
        return a.episode.localeCompare(b.episode) * dir;
      });
    }
  );
  ```

### Lifecycle Cleanup (`ngOnDestroy`):
```typescript
ngOnDestroy(): void {
  this.episodeFilterSub?.unsubscribe();
  this.routeParamSub?.unsubscribe();
  this.store.dispatch(DetailActions.clearCharacterDetail());
}
```
- **Subscription Teardown:** Explicitly unsubscribes `episodeFilterSub` and `routeParamSub` to eliminate memory leaks upon route navigation.
- **Store Reset:** Dispatches `clearCharacterDetail()` to purge the previous character dossier and episode rows from memory. This prevents stale state from flashing when navigating to another character.

---

## 7. Core Layer: Services, Models, and Mock Data

### Domain Models (`src/app/core/models/`)
- `character.model.ts`:
  - `Character`: Strongly typed representation matching Rick & Morty API schema (`id`, `name`, `status`, `species`, `gender`, `origin`, `location`, `image`, `episode`).
  - `CharacterApiResponse`: Paginated envelope (`info: { count, pages, next, prev }`, `results: Character[]`).
  - `ViewMode`: `'grid' | 'list'`.
- `episode.model.ts`:
  - `Episode`: Episode schema (`id`, `name`, `air_date`, `episode`, `characters`, `url`).
- `role.model.ts`:
  - `UserRole`: `'ADMIN' | 'VIEWER'`.
  - `RoleState`: Current role and access denied notifications.

### `RoleService` Architecture (`role.service.ts`)
```typescript
@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly storageKey = 'rm_simulated_user_role';
  private readonly currentRole$ = new BehaviorSubject<UserRole>(this.getInitialRole());

  getInitialRole(): UserRole {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'ADMIN' || saved === 'VIEWER') return saved;
    }
    return 'ADMIN';
  }

  setRole(role: UserRole): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.storageKey, role);
    }
    this.currentRole$.next(role);
  }
}
```
- Encapsulates role switching and persistence in `localStorage`.
- Safely verifies `typeof window !== 'undefined'` for SSR compatibility.

### `RickAndMortyService` (`rick-and-morty.service.ts`)
- **Single HTTP Source of Truth:** Interacts directly with `https://rickandmortyapi.com/api`.
- **404 Normalization:** When a character name search yields 0 matches, the API returns HTTP 404. The service catches this and emits `{ info: { count: 0, pages: 0 }, results: [] }` instead of treating it as a system error.
- **Batch Episode Query:** Extracts episode IDs and queries `https://rickandmortyapi.com/api/episode/{id1,id2,...}` in a single round-trip instead of 50+ individual HTTP calls.
- **Network Resilience:** Employs RxJS `retry({ count: 2, delay: 500 })` for non-404 transient errors, protecting against rate-limiting spikes.

---

## 8. NgRx Reactive State Machine Deep-Dive

The state management architecture comprises three independent slices: `characters`, `characterDetail`, and `role`.

### 1. `createAction`
Actions express unique events occurring in the application:
```typescript
export const loadCharacters = createAction(
  '[Characters] Load Characters',
  props<{ page: number; name?: string }>()
);

export const loadCharactersSuccess = createAction(
  '[Characters] Load Characters Success',
  props<{ response: CharacterApiResponse }>()
);
```
- Uses unique action type strings namespaced by slice (`[Characters]`).
- Carries strongly-typed payloads via `props<T>()`.

### 2. `createEffect` & Side-Effect Orchestration
Effects isolate asynchronous tasks from UI components:
```typescript
loadCharacters$ = createEffect(() =>
  this.actions$.pipe(
    ofType(CharacterActions.loadCharacters),
    switchMap(({ page, name }) =>
      this.apiService.getCharacters(page, name).pipe(
        map((response) => CharacterActions.loadCharactersSuccess({ response })),
        catchError(() =>
          of(
            CharacterActions.loadCharactersFailure({
              error: 'Failed to load characters. Please check your network connection.'
            })
          )
        )
      )
    )
  )
);
```

### 3. What is `ofType`?
`ofType` is an RxJS operator provided by `@ngrx/effects`. It filters the infinite stream of actions (`actions$`), allowing only actions matching the specified action creator(s) to pass through to the operator chain.

### 4. Why `switchMap`?
`switchMap` projects each source action into an inner Observable (the HTTP request). Crucially, **`switchMap` automatically cancels any prior, in-flight inner Observable whenever a new action arrives**.
- *Real-World Impact:* If a user rapidly searches "R", "Ri", "Ric", "Rick", `switchMap` ensures that stale responses from "R" or "Ri" are discarded and cancelled immediately, preventing race conditions and stale UI rendering.

### 5. `createReducer` & `on`
Reducers are pure functions computing the next state based on the current state and incoming action:
```typescript
export const charactersReducer = createReducer(
  initialCharactersState,

  on(CharacterActions.loadCharacters, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(CharacterActions.loadCharactersSuccess, (state, { response }) => ({
    ...state,
    characters: response.results || [],
    totalCharacters: response.info?.count || 0,
    totalPages: response.info?.pages || 0,
    loading: false,
    error: null
  })),

  on(CharacterActions.loadCharactersFailure, (state, { error }) => ({
    ...state,
    characters: [],
    totalCharacters: 0,
    totalPages: 0,
    loading: false,
    error
  }))
);
```
- Guarantees strict immutability through shallow copying (`...state`).
- Computes deterministic outputs with zero side effects.

---

## 9. Testing Harness: Jasmine Unit Tests & Playwright E2E Suite

### Jasmine Unit Tests (23 Automated Tests)
Located alongside components and services (`*.spec.ts`):
1. **`role.guard.spec.ts`:** Tests `CanActivateFn` under ADMIN (returns `true`) and VIEWER (redirects to `/access-denied`).
2. **`role.service.spec.ts`:** Verifies default initialization, role updates, and `localStorage` synchronization.
3. **`rick-and-morty.service.spec.ts`:** Validates 404 normalization, single episode resolution, and batch episode resolution.
4. **`character-list.component.spec.ts`:** Validates search debouncing with Jasmine `fakeAsync` and `tick(360)`, grid/list toggling, and role navigation triggers.
5. **`character-detail.component.spec.ts`:** Tests route param resolution, episode filtering, column sorting, and teardown logic.

Run command:
```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

### Playwright End-to-End Suite (`e2e/explorer.spec.ts`)
Tests live browser behavior across all functional requirements:
- **Test 1:** Home Page character cards, status indicators, grid/list view switching.
- **Test 2:** Global search with RxJS debouncing, empty results state, and reset filter.
- **Test 3:** Navigation to `/character/:id`, profile dossier verification, and episode table headers (`name`, `air_date`, `episode`).
- **Test 4:** In-memory episode name filtering (250ms debounce) and table sorting.
- **Test 5:** Viewer authorization lock on character card, HTTP 403 redirect, and 1-click Admin unlock promotion.
- **Test 6:** Direct route guard protection blocking Viewer from accessing `/character/:id` via URL.
- **Test 7:** State preservation between navigation (maintaining search term and list toggle when returning from character details).

Run command:
```bash
npm run test:e2e
```
