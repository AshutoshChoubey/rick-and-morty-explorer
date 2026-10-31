# Rick & Morty — Character Explorer

A production-grade web application built with **Angular 19**, **NgRx 19** (`@ngrx/store`, `@ngrx/effects`, `@ngrx/store-devtools`), **Angular Material**, **Tailwind CSS**, and **RxJS**, consuming the public [Rick and Morty REST API](https://rickandmortyapi.com/).

---

## Features

### 1. Home Page — Character Directory & Search
- **Grid & List Views:** Toggle between card grid view and a high-performance tabular list view powered by Angular Material Table (`mat-table`) with column definitions: `avatar`, `name`, `status`, `species`, `gender`, `episodes`, and `action`.
- **Character Metadata:** Every character displays:
  - High-resolution avatar with status pulse indicator.
  - Name, species, and gender.
  - Total episode appearances count.
  - Character status badge (`Alive`, `Dead`, `unknown`).
- **Debounced Name Search:** Search bar powered by an RxJS effect pipeline (`debounceTime(350)` and `distinctUntilChanged()`) querying `https://rickandmortyapi.com/api/character?name={name}&page={number}`. Gracefully catches and normalizes API 404 responses when 0 matches are returned.
- **State Preservation Between Navigation:** Preserves the user's active page number, search query, view mode, and selected character highlight in the NgRx Store when navigating to details and back.
- **Pagination:** First, Previous, Next, Last, and numeric page jumper controls wired directly into the NgRx state tree.

### 2. Character Details & Episode Table
- **Dedicated Route (`/character/:id`):** Displays character details, metadata, and episode appearances.
- **Episode Table:** Implemented using Angular Material Table (`mat-table`) with headers:
  1. `name`
  2. `air_date`
  3. `episode`
- **Client-Side Free-Form Episode Filtering:** Instant in-memory filtering by episode title, powered by RxJS debouncing (`debounceTime(250)`, `distinctUntilChanged()`) and NgRx memoized selector computation (`selectFilteredEpisodes`).
- **Column Sorting:** Multi-column sorting on `name`, `air_date`, and `episode`.
- **Single-Request Batch Episode Resolution:** Optimizes episode loading by parsing episode IDs and querying `https://rickandmortyapi.com/api/episode/{id1,id2,...}` in a single HTTP request instead of issuing multiple sequential round-trips.

### 3. Role-Based Authorization (Admin vs Viewer)
- **Roles:**
  - **Admin:** Full access to all routes, character list, and character details.
  - **Viewer:** Access restricted strictly to the Character List.
- **Simulated Role Switcher:** Toggle between Admin and Viewer directly from the navigation bar. Persisted to `localStorage` via NgRx `RoleEffects`.
- **Route Guard:** A functional `roleGuard` (`CanActivateFn`) protects `/character/:id` by querying `selectCanAccessDetails` from the NgRx Store. When a Viewer attempts to access character details, the guard dispatches `RoleActions.notifyAccessDenied` and redirects to `/access-denied`.
- **Error Messaging:** The `/access-denied` page displays an HTTP 403 Forbidden status, explains the restriction, and includes a 1-click button to promote the session to Admin. A global notification banner also provides inline context.

---

## Tech Stack & Architecture

> For an in-depth breakdown of `angular.json`, `main.ts`, `app.config.ts`, route guards, NgRx operators (`ofType`, `switchMap`), and component design decisions, refer to [ARCHITECTURE.md](./ARCHITECTURE.md).

- **Framework:** Angular 19 (Standalone Components, Signals, `inject()`, Control Flow `@if` / `@for`)
- **State Management:** **NgRx 19**
  - Store: `@ngrx/store` with feature slices (`characters`, `characterDetail`, `role`)
  - Effects: `@ngrx/effects` (`CharactersEffects`, `CharacterDetailEffects`, `RoleEffects`)
  - DevTools: `@ngrx/store-devtools`
  - Reactivity Bridge: `store.selectSignal()` for zero-boilerplate template bindings
- **Component Library:** Angular Material 19 (`@angular/material`, `@angular/cdk`, `@angular/animations`)
- **Utility Styling:** Tailwind CSS
- **Reactive Stream Orchestration:** RxJS (`debounceTime`, `distinctUntilChanged`, `switchMap`, `withLatestFrom`, `catchError`, `map`, `filter`, `take`)
- **Unit Testing:** Jasmine & Karma (23 automated unit tests)

---

## Rick & Morty Endpoints Used

| Purpose | Endpoint | Method |
| :--- | :--- | :--- |
| Characters List (Paginated) | `https://rickandmortyapi.com/api/character?page={number}` | `GET` |
| Search Characters by Name | `https://rickandmortyapi.com/api/character?name={name}&page={number}` | `GET` |
| Single Character Details | `https://rickandmortyapi.com/api/character/{id}` | `GET` |
| Single Episode Record | `https://rickandmortyapi.com/api/episode/{id}` | `GET` |
| Batch Episode Records | `https://rickandmortyapi.com/api/episode/{id1,id2,...}` | `GET` |

---

## Getting Started

### Prerequisites
- Node.js 20+ or 22+
- npm 10+

### Install & Run Locally
```bash
# Clone the repository and enter directory
cd rick-and-morty-explorer

# Install dependencies
npm install

# Start development server
npm start
```
The application will run at `http://localhost:4200/`.

### Run Unit Tests
```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

### Production Build
```bash
npm run build
```
Build output is generated in `dist/rick-and-morty-explorer/browser`.

---

## Deploying to Cloudflare Pages

This application is pre-configured for instant deployment on **Cloudflare Pages**.

### Cloudflare Pages Settings
1. **Framework preset:** `None` / `Angular`
2. **Build command:** `npm run build`
3. **Build output directory:** `dist/rick-and-morty-explorer/browser`
4. **Environment Variables:** Set `NODE_VERSION` to `22` (or `20`)

### Cloudflare Pages SPA Routing
Cloudflare Pages provides native Single Page Application (SPA) routing when no `404.html` exists in the deployment directory. To guarantee zero redirect loop warnings (`code: 100324`) and support edge asset caching:
- The build script automatically emits both `index.html` and `200.html` to `dist/rick-and-morty-explorer/browser`.
- Unmatched deep paths (e.g. `/character/1`, `/access-denied`) seamlessly resolve to `index.html` with HTTP 200.
- Custom security and caching headers are applied via `public/_headers`.

---

## Project Structure

```
src/
├── app/
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.component.ts
│   ├── app.config.ts                 # provideStore, provideEffects, provideStoreDevtools, provideHttpClient
│   ├── app.routes.ts                 # Route definitions and roleGuard configuration
│   ├── core/
│   │   ├── guards/
│   │   │   ├── role.guard.ts         # Functional CanActivateFn guard backed by NgRx Store
│   │   │   └── role.guard.spec.ts
│   │   ├── models/
│   │   │   ├── character.model.ts
│   │   │   ├── episode.model.ts
│   │   │   └── role.model.ts
│   │   ├── services/
│   │   │   ├── character-state.service.ts
│   │   │   ├── rick-and-morty.service.ts
│   │   │   ├── rick-and-morty.service.spec.ts
│   │   │   ├── role.service.ts
│   │   │   └── role.service.spec.ts
│   │   └── store/
│   │       ├── characters/           # NgRx: Characters List Slice
│   │       │   ├── characters.actions.ts
│   │       │   ├── characters.reducer.ts
│   │       │   ├── characters.selectors.ts
│   │       │   └── characters.effects.ts
│   │       ├── character-detail/     # NgRx: Character Detail & Episodes Slice
│   │       │   ├── character-detail.actions.ts
│   │       │   ├── character-detail.reducer.ts
│   │       │   ├── character-detail.selectors.ts
│   │       │   └── character-detail.effects.ts
│   │       └── role/                 # NgRx: Role & Authorization Slice
│   │           ├── role.actions.ts
│   │           ├── role.reducer.ts
│   │           ├── role.selectors.ts
│   │           └── role.effects.ts
│   ├── features/
│   │   ├── access-denied/
│   │   │   └── access-denied.component.ts
│   │   ├── character-detail/
│   │   │   ├── character-detail.component.ts
│   │   │   └── character-detail.component.spec.ts
│   │   └── character-list/
│   │       ├── character-list.component.ts
│   │       └── character-list.component.spec.ts
│   └── shared/
│       └── components/
│           ├── access-denied-banner/
│           │   └── access-denied-banner.component.ts
│           └── navbar/
│               └── navbar.component.ts
├── index.html
├── main.ts
├── styles.scss
public/
├── _headers                          # Cloudflare security & caching rules
└── favicon.ico
```
