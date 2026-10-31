import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Character, ViewMode } from '../../core/models/character.model';
import * as CharacterActions from '../../core/store/characters/characters.actions';
import * as RoleActions from '../../core/store/role/role.actions';
import {
  selectAllCharacters,
  selectTotalCharacters,
  selectTotalPages,
  selectCurrentPage,
  selectSearchQuery,
  selectViewMode,
  selectSelectedCharacterId,
  selectCharactersLoading,
  selectCharactersError
} from '../../core/store/characters/characters.selectors';
import { selectIsAdmin, selectIsViewer } from '../../core/store/role/role.selectors';

@Component({
  selector: 'app-character-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      <section aria-label="Explorer Overview" class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-emerald-950/30 border border-slate-800 p-6 sm:p-8 mb-8 backdrop-blur-md">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Character Explorer
            </h1>
            <p class="text-slate-400 text-sm sm:text-base mt-1.5 max-w-2xl">
              Browse characters from Rick & Morty. Search by name, toggle between grid and list views, and inspect episode appearances.
            </p>
          </div>

          <div class="flex items-center gap-3 sm:gap-4 shrink-0 bg-slate-950/60 border border-slate-800 rounded-xl p-3 sm:p-4">
            <div class="text-center px-3 border-r border-slate-800">
              <span class="block text-2xl font-black font-mono text-emerald-400">
                {{ totalCharacters() }}
              </span>
              <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Characters</span>
            </div>
            <div class="text-center px-3">
              <span class="block text-2xl font-black font-mono text-cyan-400">
                {{ totalPages() }}
              </span>
              <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Pages</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Search and Layout Controls" class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl shadow-black/20 backdrop-blur-md">
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          <div class="relative flex-1">
            <div class="flex items-center w-full h-12 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25 transition-all shadow-inner">
              <mat-icon class="!text-slate-400 !w-5 !h-5 mr-2.5 flex items-center justify-center shrink-0">search</mat-icon>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchInput($event)"
                placeholder="Search characters by name (e.g., Rick Sanchez, Morty, Summer)..."
                class="w-full bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-0"
              />
              @if (searchQuery()) {
                <button
                  type="button"
                  mat-icon-button
                  (click)="clearSearch()"
                  class="!w-7 !h-7 !flex !items-center !justify-center !text-slate-400 hover:!text-slate-200 shrink-0"
                  title="Clear search">
                  <mat-icon class="!w-4 !h-4 text-xs">close</mat-icon>
                </button>
              }
            </div>
          </div>

          <div class="flex items-center justify-between md:justify-end gap-3 shrink-0">
            
            <div class="text-xs font-mono text-slate-400 px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              Page <span class="text-emerald-400 font-bold">{{ currentPage() }}</span> of <span class="text-slate-300 font-bold">{{ totalPages() || 1 }}</span>
            </div>

            <mat-button-toggle-group 
              [value]="viewMode()" 
              (change)="setViewMode($event.value)"
              aria-label="View Mode"
              class="!bg-slate-950/90 !border !border-slate-700/80 !rounded-xl !p-0.5 overflow-hidden">
              
              <mat-button-toggle 
                value="grid" 
                class="!text-xs !font-bold"
                [class.mat-button-toggle-checked]="viewMode() === 'grid'">
                <div class="flex items-center gap-1.5 px-2 py-1">
                  <mat-icon class="!w-4 !h-4 text-sm flex items-center justify-center">grid_view</mat-icon>
                  <span class="hidden sm:inline">Grid</span>
                </div>
              </mat-button-toggle>

              <mat-button-toggle 
                value="list" 
                class="!text-xs !font-bold"
                [class.mat-button-toggle-checked]="viewMode() === 'list'">
                <div class="flex items-center gap-1.5 px-2 py-1">
                  <mat-icon class="!w-4 !h-4 text-sm flex items-center justify-center">view_list</mat-icon>
                  <span class="hidden sm:inline">List</span>
                </div>
              </mat-button-toggle>

            </mat-button-toggle-group>

          </div>
        </div>
      </section>

      @if (loading()) {
        <div class="py-16 flex flex-col items-center justify-center gap-4">
          <mat-spinner diameter="44" strokeWidth="4" class="!text-emerald-400"></mat-spinner>
          <span class="text-xs font-mono text-slate-400 animate-pulse">Loading characters...</span>
        </div>
      }

      @else if (characters().length === 0) {
        <mat-card class="text-center py-16 px-4 !bg-slate-900/40 !border !border-dashed !border-slate-800 !rounded-2xl">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-3xl">
            🛸
          </div>
          <h3 class="text-lg font-bold text-white mb-1">No Characters Found</h3>
          <p class="text-slate-400 text-sm max-w-md mx-auto mb-5">
            No characters matched "{{ searchQuery() }}". Try adjusting your search query.
          </p>
          <div class="flex justify-center">
            <button
              mat-flat-button
              type="button"
              (click)="clearSearch()"
              class="!bg-emerald-500 !text-slate-950 !font-bold !text-xs !rounded-xl">
              Clear Search Filter
            </button>
          </div>
        </mat-card>
      }

      @else if (viewMode() === 'grid') {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          @for (char of characters(); track char.id) {
            <mat-card 
              (click)="onSelectCharacter(char)"
              [class.ring-2]="selectedCharacterId() === char.id"
              [class.ring-emerald-400]="selectedCharacterId() === char.id"
              class="group relative !bg-slate-900/80 hover:!bg-slate-850 !border !border-slate-800 hover:!border-emerald-500/50 !rounded-2xl overflow-hidden !shadow-lg hover:!shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer flex flex-col">
              
              <div class="relative w-full aspect-square overflow-hidden bg-slate-950">
                <img
                  [src]="char.image"
                  [alt]="char.name"
                  loading="lazy"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  (error)="handleImageError($event)"
                />
                
                <div class="absolute top-3 left-3">
                  <span 
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide backdrop-blur-md border shadow-md"
                    [ngClass]="getStatusBadgeClasses(char.status)">
                    <span class="w-2 h-2 rounded-full" [ngClass]="getStatusDotClasses(char.status)"></span>
                    <span>{{ char.status }}</span>
                  </span>
                </div>

                <div class="absolute bottom-3 right-3">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-950/80 text-emerald-400 border border-slate-700/80 backdrop-blur-md shadow-md">
                    <mat-icon class="!w-3.5 !h-3.5 text-xs inline-flex items-center justify-center">movie</mat-icon>
                    <span>{{ char.episode.length }} {{ char.episode.length === 1 ? 'ep' : 'eps' }}</span>
                  </span>
                </div>
              </div>

              <mat-card-content class="!p-4 sm:!p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 class="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-2">
                    {{ char.name }}
                  </h3>

                  <div class="flex flex-wrap items-center gap-1.5 mb-3">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      <span>🧬</span>
                      <span>{{ char.species }}</span>
                    </span>

                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      <span>{{ getGenderIcon(char.gender) }}</span>
                      <span>{{ char.gender }}</span>
                    </span>
                  </div>

                  <div class="text-xs text-slate-400 space-y-1 mb-4">
                    <div class="flex items-center gap-1.5 truncate">
                      <span class="text-slate-400 shrink-0">Origin:</span>
                      <span class="text-slate-300 truncate font-medium">{{ char.origin.name }}</span>
                    </div>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-400 group-hover:text-emerald-300 transition-colors flex items-center gap-1">
                    <span>View Episodes</span>
                    <mat-icon class="!w-3.5 !h-3.5 text-xs transform group-hover:translate-x-1 transition-transform inline-flex items-center justify-center">chevron_right</mat-icon>
                  </span>

                  @if (isViewer()) {
                    <span class="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" title="Viewer role: Requires Admin for Details">
                      <mat-icon class="!w-3 !h-3 text-[10px] inline-flex items-center justify-center">lock</mat-icon>
                      Admin req.
                    </span>
                  } @else {
                    <span class="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                      <mat-icon class="!w-3 !h-3 text-[10px] inline-flex items-center justify-center">lock_open</mat-icon>
                      Accessible
                    </span>
                  }
                </div>

              </mat-card-content>

            </mat-card>
          }
        </div>
      }

      @else {
        <mat-card class="!bg-slate-900/90 !border !border-slate-800 !rounded-2xl !shadow-xl overflow-hidden backdrop-blur-md">
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="characters()" class="w-full text-left">
              
              <ng-container matColumnDef="avatar">
                <th mat-header-cell *matHeaderCellDef class="!py-3.5 !px-4 sm:!px-6">Avatar</th>
                <td mat-cell *matCellDef="let char" class="!py-3.5 !px-4 sm:!px-6">
                  <div class="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-700 bg-slate-950">
                    <img
                      [src]="char.image"
                      [alt]="char.name"
                      loading="lazy"
                      class="w-full h-full object-cover"
                      (error)="handleImageError($event)"
                    />
                    <span 
                      class="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900"
                      [ngClass]="getStatusDotClasses(char.status)">
                    </span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef class="!py-3.5 !px-4 sm:!px-6">Name</th>
                <td mat-cell *matCellDef="let char" class="!py-3.5 !px-4 sm:!px-6 font-medium">
                  <div class="flex flex-col">
                    <span class="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors text-sm sm:text-base">
                      {{ char.name }}
                    </span>
                    <span class="text-xs text-slate-400 truncate max-w-[200px]">
                      Origin: {{ char.origin.name }}
                    </span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef class="!py-3.5 !px-4 sm:!px-6">Status</th>
                <td mat-cell *matCellDef="let char" class="!py-3.5 !px-4 sm:!px-6 whitespace-nowrap">
                  <span 
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                    [ngClass]="getStatusBadgeClasses(char.status)">
                    <span class="w-2 h-2 rounded-full" [ngClass]="getStatusDotClasses(char.status)"></span>
                    <span>{{ char.status }}</span>
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="species">
                <th mat-header-cell *matHeaderCellDef class="!py-3.5 !px-4 sm:!px-6">Species</th>
                <td mat-cell *matCellDef="let char" class="!py-3.5 !px-4 sm:!px-6 text-slate-300 text-xs whitespace-nowrap">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                    <span>🧬</span>
                    <span>{{ char.species }}</span>
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="gender">
                <th mat-header-cell *matHeaderCellDef class="!py-3.5 !px-4 sm:!px-6">Gender</th>
                <td mat-cell *matCellDef="let char" class="!py-3.5 !px-4 sm:!px-6 text-slate-300 text-xs whitespace-nowrap">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                    <span>{{ getGenderIcon(char.gender) }}</span>
                    <span>{{ char.gender }}</span>
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="episodes">
                <th mat-header-cell *matHeaderCellDef class="!py-3.5 !px-4 sm:!px-6">Episodes</th>
                <td mat-cell *matCellDef="let char" class="!py-3.5 !px-4 sm:!px-6 whitespace-nowrap">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                    <mat-icon class="!w-3.5 !h-3.5 text-xs inline-flex items-center justify-center">movie</mat-icon>
                    <span>{{ char.episode.length }}</span>
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef class="!py-3.5 !px-4 sm:!px-6 text-right">Action</th>
                <td mat-cell *matCellDef="let char" class="!py-3.5 !px-4 sm:!px-6 text-right whitespace-nowrap">
                  <button
                    mat-stroked-button
                    type="button"
                    (click)="onSelectCharacter(char); $event.stopPropagation()"
                    class="!rounded-lg !text-xs !font-bold !border-slate-700 hover:!bg-emerald-500 hover:!text-slate-950 hover:!border-emerald-400 transition-all">
                    @if (isViewer()) {
                      <span class="inline-flex items-center gap-1">
                        <mat-icon class="!w-3.5 !h-3.5 text-xs mr-0.5 inline-flex items-center justify-center">lock</mat-icon>
                        <span>View Details</span>
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1">
                        <span>View Details</span>
                        <mat-icon class="!w-3.5 !h-3.5 text-xs ml-0.5 inline-flex items-center justify-center">arrow_forward</mat-icon>
                      </span>
                    }
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="listColumns" class="!bg-slate-950/70 border-b border-slate-800"></tr>
              <tr 
                mat-row 
                *matRowDef="let char; columns: listColumns;" 
                (click)="onSelectCharacter(char)"
                [ngClass]="{ 'bg-emerald-950/20': selectedCharacterId() === char.id }"
                class="hover:!bg-slate-800/40 transition-colors cursor-pointer group">
              </tr>

            </table>
          </div>
        </mat-card>
      }

      @if (totalPages() > 1) {
        <nav aria-label="Pagination Navigation" class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
          <div class="text-xs text-slate-400 font-mono">
            Showing Page <span class="text-emerald-400 font-bold">{{ currentPage() }}</span> of <span class="text-slate-200 font-bold">{{ totalPages() }}</span>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              type="button"
              mat-button
              (click)="goToPage(1)"
              [disabled]="currentPage() === 1 || loading()"
              class="!min-w-0 !px-2.5 !py-1 !rounded-lg !text-xs !font-bold !bg-slate-800/80 hover:!bg-slate-700 disabled:!opacity-40 text-slate-300 border !border-slate-700 transition-colors"
              title="First Page">
              « First
            </button>

            <button
              type="button"
              mat-button
              (click)="goToPage(currentPage() - 1)"
              [disabled]="currentPage() === 1 || loading()"
              class="!min-w-0 !px-3 !py-1 !rounded-lg !text-xs !font-bold !bg-slate-800/80 hover:!bg-slate-700 disabled:!opacity-40 text-slate-300 border !border-slate-700 transition-colors">
              ‹ Prev
            </button>

            @for (p of getVisiblePages(); track p) {
              <button
                type="button"
                (click)="goToPage(p)"
                [ngClass]="currentPage() === p ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
                class="w-8 h-8 rounded-lg text-xs border border-slate-700 flex items-center justify-center transition-all">
                {{ p }}
              </button>
            }

            <button
              type="button"
              mat-button
              (click)="goToPage(currentPage() + 1)"
              [disabled]="currentPage() === totalPages() || loading()"
              class="!min-w-0 !px-3 !py-1 !rounded-lg !text-xs !font-bold !bg-slate-800/80 hover:!bg-slate-700 disabled:!opacity-40 text-slate-300 border !border-slate-700 transition-colors">
              Next ›
            </button>

            <button
              type="button"
              mat-button
              (click)="goToPage(totalPages())"
              [disabled]="currentPage() === totalPages() || loading()"
              class="!min-w-0 !px-2.5 !py-1 !rounded-lg !text-xs !font-bold !bg-slate-800/80 hover:!bg-slate-700 disabled:!opacity-40 text-slate-300 border !border-slate-700 transition-colors"
              title="Last Page">
              Last »
            </button>
          </div>
        </nav>
      }

    </main>
  `
})
export class CharacterListComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly subscriptions = new Subscription();

  readonly listColumns = ['avatar', 'name', 'status', 'species', 'gender', 'episodes', 'action'];

  readonly characters = this.store.selectSignal(selectAllCharacters);
  readonly totalCharacters = this.store.selectSignal(selectTotalCharacters);
  readonly totalPages = this.store.selectSignal(selectTotalPages);
  readonly currentPage = this.store.selectSignal(selectCurrentPage);
  readonly searchQuery = this.store.selectSignal(selectSearchQuery);
  readonly viewMode = this.store.selectSignal(selectViewMode);
  readonly selectedCharacterId = this.store.selectSignal(selectSelectedCharacterId);
  readonly loading = this.store.selectSignal(selectCharactersLoading);
  readonly errorMessage = this.store.selectSignal(selectCharactersError);
  readonly isAdmin = this.store.selectSignal(selectIsAdmin);
  readonly isViewer = this.store.selectSignal(selectIsViewer);

  ngOnInit(): void {
    this.store.dispatch(
      CharacterActions.loadCharacters({
        page: this.currentPage(),
        name: this.searchQuery()
      })
    );

    const charSub = this.store.select(selectAllCharacters).subscribe();
    this.subscriptions.add(charSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSearchInput(value: string): void {
    this.store.dispatch(CharacterActions.setSearchQuery({ query: value }));
  }

  clearSearch(): void {
    this.store.dispatch(CharacterActions.setSearchQuery({ query: '' }));
    this.store.dispatch(CharacterActions.loadCharacters({ page: 1, name: '' }));
  }

  setViewMode(viewMode: ViewMode): void {
    this.store.dispatch(CharacterActions.setViewMode({ viewMode }));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.store.dispatch(CharacterActions.setPage({ page }));
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSelectCharacter(char: Character): void {
    this.store.dispatch(CharacterActions.setSelectedCharacterId({ id: char.id }));

    if (this.isViewer()) {
      this.store.dispatch(RoleActions.notifyAccessDenied({ targetRoute: `/character/${char.id}` }));
      this.router.navigate(['/access-denied'], {
        queryParams: { attempted: `/character/${char.id}` }
      });
      return;
    }

    this.router.navigate(['/character', char.id]);
  }

  getVisiblePages(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const maxButtons = 5;

    if (total <= maxButtons) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStatusBadgeClasses(status: string): string {
    switch (status?.toLowerCase()) {
      case 'alive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'dead':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  }

  getStatusDotClasses(status: string): string {
    switch (status?.toLowerCase()) {
      case 'alive':
        return 'bg-emerald-400 animate-pulse';
      case 'dead':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  }

  getGenderIcon(gender: string): string {
    switch (gender?.toLowerCase()) {
      case 'male':
        return '♂';
      case 'female':
        return '♀';
      case 'genderless':
        return '⚪';
      default:
        return '❓';
    }
  }

  handleImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://rickandmortyapi.com/api/character/avatar/19.jpeg';
    }
  }
}
