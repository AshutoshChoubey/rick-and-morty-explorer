import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as DetailActions from '../../core/store/character-detail/character-detail.actions';
import * as CharacterActions from '../../core/store/characters/characters.actions';
import {
  selectCharacter,
  selectEpisodes,
  selectFilteredEpisodes,
  selectLoadingCharacter,
  selectLoadingEpisodes,
  selectEpisodeFilter,
  selectSortBy,
  selectSortAsc,
  selectCharacterDetailError
} from '../../core/store/character-detail/character-detail.selectors';

@Component({
  selector: 'app-character-detail',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      
      <div class="flex items-center justify-between mb-6">
        <a 
          routerLink="/" 
          mat-stroked-button
          class="!border-slate-800 hover:!border-slate-700 !bg-slate-900/80 !text-slate-300 hover:!text-white !rounded-xl !text-sm !font-semibold !shadow-md group">
          <mat-icon class="!w-4 !h-4 text-sm mr-1 transform group-hover:-translate-x-1 transition-transform inline-flex items-center justify-center">arrow_back</mat-icon>
          <span>Back to Character Directory</span>
        </a>

        <nav aria-label="Breadcrumb" class="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
          <a routerLink="/" class="hover:text-emerald-400 transition-colors">Directory</a>
          <span>/</span>
          <span class="text-slate-200 font-bold">{{ character()?.name || 'Character Details' }}</span>
        </nav>
      </div>

      @if (loadingCharacter()) {
        <div class="py-16 flex flex-col items-center justify-center gap-4 bg-slate-900/40 border border-slate-800 rounded-2xl mb-8">
          <mat-spinner diameter="44" strokeWidth="4" class="!text-emerald-400"></mat-spinner>
          <span class="text-xs font-mono text-slate-400 animate-pulse">Loading character details...</span>
        </div>
      } @else if (error()) {
        <div class="py-16 px-4 text-center bg-slate-900/60 border border-rose-900/50 rounded-2xl mb-8">
          <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <mat-icon>error_outline</mat-icon>
          </div>
          <h2 class="text-lg font-bold text-white mb-1">Character Not Found</h2>
          <p class="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {{ error() }}
          </p>
          <a routerLink="/" mat-flat-button class="!bg-emerald-500 !text-slate-950 !font-bold !text-xs !rounded-lg">
            Return to Directory
          </a>
        </div>
      } @else {
        @if (character(); as char) {
          <mat-card class="relative overflow-hidden !rounded-2xl !bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950 !border !border-slate-800 p-6 sm:p-8 mb-8 !shadow-2xl shadow-black/40 backdrop-blur-md">
            <div class="absolute -top-20 -right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 sm:gap-8">
              
              <div class="relative group shrink-0 mx-auto md:mx-0">
                <div class="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-950">
                  <img
                    [src]="char.image"
                    [alt]="char.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div class="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <span 
                    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border shadow-lg whitespace-nowrap"
                    [ngClass]="getStatusBadgeClasses(char.status)">
                    <span class="w-2 h-2 rounded-full" [ngClass]="getStatusDotClasses(char.status)"></span>
                    <span>{{ char.status }}</span>
                  </span>
                </div>
              </div>

              <div class="flex-1 min-w-0 text-center md:text-left">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                  <div>
                    <div class="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 mb-1">
                      <span>ID: #{{ char.id }}</span>
                      <span>•</span>
                      <span>CREATED: {{ char.created | date:'mediumDate' }}</span>
                    </div>
                    <h1 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {{ char.name }}
                    </h1>
                  </div>

                  <div class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 self-center md:self-start">
                    <mat-icon class="!w-5 !h-5 text-emerald-400 inline-flex items-center justify-center">movie</mat-icon>
                    <div class="text-left">
                      <span class="block text-base font-bold font-mono text-emerald-400 leading-tight">
                        {{ char.episode.length }}
                      </span>
                      <span class="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">Total Episodes</span>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
                  <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                    <span class="text-[11px] font-mono uppercase text-slate-400 block mb-0.5">Species</span>
                    <span class="text-sm font-bold text-slate-200 truncate block">🧬 {{ char.species }}</span>
                  </div>

                  <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                    <span class="text-[11px] font-mono uppercase text-slate-400 block mb-0.5">Gender</span>
                    <span class="text-sm font-bold text-slate-200 truncate block">
                      {{ getGenderIcon(char.gender) }} {{ char.gender }}
                    </span>
                  </div>

                  <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                    <span class="text-[11px] font-mono uppercase text-slate-400 block mb-0.5">Origin Location</span>
                    <span class="text-sm font-bold text-slate-200 truncate block" [title]="char.origin.name">
                      🌍 {{ char.origin.name }}
                    </span>
                  </div>

                  <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                    <span class="text-[11px] font-mono uppercase text-slate-400 block mb-0.5">Last Known Place</span>
                    <span class="text-sm font-bold text-slate-200 truncate block" [title]="char.location.name">
                      📍 {{ char.location.name }}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </mat-card>
        }
      }

      <mat-card class="!bg-slate-900/90 !border !border-slate-800 !rounded-2xl !shadow-xl overflow-hidden backdrop-blur-md">
        
        <div class="p-5 sm:p-6 border-b border-slate-800/80 bg-slate-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-extrabold text-white tracking-tight">
                Episode Appearances
              </h2>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {{ filteredEpisodes().length }} / {{ episodes().length }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Table of all TV show episodes featuring this character.
            </p>
          </div>

          <div class="relative w-full md:w-80">
            <div class="flex items-center w-full h-11 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/25 transition-all shadow-inner">
              <mat-icon class="!text-slate-400 !w-5 !h-5 mr-2 flex items-center justify-center shrink-0">search</mat-icon>
              <input
                type="text"
                [ngModel]="rawEpisodeFilter()"
                (ngModelChange)="onEpisodeFilterInput($event)"
                placeholder="Filter by episode name..."
                class="w-full bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-0"
              />
              @if (rawEpisodeFilter()) {
                <button
                  type="button"
                  mat-icon-button
                  (click)="clearEpisodeFilter()"
                  class="!w-7 !h-7 !flex !items-center !justify-center !text-slate-400 hover:!text-slate-200 shrink-0"
                  title="Clear filter">
                  <mat-icon class="!w-4 !h-4 text-xs">close</mat-icon>
                </button>
              }
            </div>
          </div>

        </div>

        @if (loadingEpisodes()) {
          <div class="p-12 flex flex-col items-center justify-center gap-3">
            <mat-spinner diameter="36" strokeWidth="3" class="!text-cyan-400"></mat-spinner>
            <span class="text-xs font-mono text-slate-400">Loading episodes...</span>
          </div>
        }

        @else if (filteredEpisodes().length === 0) {
          <div class="py-16 px-4 text-center">
            <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
              🔍
            </div>
            <h4 class="text-base font-bold text-white mb-1">No Matching Episodes Found</h4>
            <p class="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              No episode names contain "{{ episodeSearchFilter() }}".
            </p>
            <button
              mat-flat-button
              type="button"
              (click)="clearEpisodeFilter()"
              class="!bg-cyan-500 !text-slate-950 !font-bold !text-xs !rounded-lg">
              Reset Episode Filter
            </button>
          </div>
        }

        @else {
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="filteredEpisodes()" class="w-full text-left">
              
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef class="!py-3.5 !px-4 sm:!px-6">
                  <button 
                    type="button" 
                    (click)="setSort('name')"
                    class="flex items-center gap-1.5 hover:text-emerald-400 transition-colors uppercase font-mono text-xs">
                    <span>name</span>
                    <span class="text-xs">{{ getSortIcon('name') }}</span>
                  </button>
                </th>
                <td mat-cell *matCellDef="let ep" class="!py-3.5 !px-4 sm:!px-6 font-medium text-slate-100">
                  <div class="flex items-center gap-2.5">
                    <mat-icon class="!w-4 !h-4 text-sm text-slate-400 inline-flex items-center justify-center">tv</mat-icon>
                    <span class="font-semibold">{{ ep.name }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="air_date">
                <th mat-header-cell *matHeaderCellDef class="!py-3.5 !px-4 sm:!px-6">
                  <button 
                    type="button" 
                    (click)="setSort('air_date')"
                    class="flex items-center gap-1.5 hover:text-emerald-400 transition-colors uppercase font-mono text-xs">
                    <span>air_date</span>
                    <span class="text-xs">{{ getSortIcon('air_date') }}</span>
                  </button>
                </th>
                <td mat-cell *matCellDef="let ep" class="!py-3.5 !px-4 sm:!px-6 text-slate-300 font-mono text-xs whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <mat-icon class="!w-3.5 !h-3.5 text-xs text-slate-400 inline-flex items-center justify-center">calendar_today</mat-icon>
                    <span>{{ ep.air_date }}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="episode">
                <th mat-header-cell *matHeaderCellDef class="!py-3.5 !px-4 sm:!px-6 text-right sm:text-left">
                  <button 
                    type="button" 
                    (click)="setSort('episode')"
                    class="flex items-center gap-1.5 hover:text-emerald-400 transition-colors uppercase font-mono text-xs">
                    <span>episode</span>
                    <span class="text-xs">{{ getSortIcon('episode') }}</span>
                  </button>
                </th>
                <td mat-cell *matCellDef="let ep" class="!py-3.5 !px-4 sm:!px-6 text-right sm:text-left whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {{ ep.episode }}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns" class="!bg-slate-950/70 border-b border-slate-800"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:!bg-slate-800/40 transition-colors"></tr>

            </table>
          </div>
        }

        <div class="p-4 bg-slate-950/70 border-t border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Displaying {{ filteredEpisodes().length }} of {{ episodes().length }} episodes</span>
        </div>

      </mat-card>

    </main>
  `
})
export class CharacterDetailComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly displayedColumns = ['name', 'air_date', 'episode'];

  readonly character = this.store.selectSignal(selectCharacter);
  readonly episodes = this.store.selectSignal(selectEpisodes);
  readonly filteredEpisodes = this.store.selectSignal(selectFilteredEpisodes);
  readonly loadingCharacter = this.store.selectSignal(selectLoadingCharacter);
  readonly loadingEpisodes = this.store.selectSignal(selectLoadingEpisodes);
  readonly episodeSearchFilter = this.store.selectSignal(selectEpisodeFilter);
  readonly sortBy = this.store.selectSignal(selectSortBy);
  readonly sortAsc = this.store.selectSignal(selectSortAsc);
  readonly error = this.store.selectSignal(selectCharacterDetailError);

  readonly rawEpisodeFilter = signal<string>('');

  private readonly episodeFilterSubject = new Subject<string>();
  private episodeFilterSub?: Subscription;
  private routeParamSub?: Subscription;

  ngOnInit(): void {
    this.episodeFilterSub = this.episodeFilterSubject
      .pipe(
        debounceTime(250),
        distinctUntilChanged()
      )
      .subscribe((debouncedTerm) => {
        this.store.dispatch(DetailActions.setEpisodeFilter({ term: debouncedTerm }));
      });

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
  }

  ngOnDestroy(): void {
    this.episodeFilterSub?.unsubscribe();
    this.routeParamSub?.unsubscribe();
    this.store.dispatch(DetailActions.clearCharacterDetail());
  }

  onEpisodeFilterInput(value: string): void {
    this.rawEpisodeFilter.set(value);
    this.episodeFilterSubject.next(value);
  }

  clearEpisodeFilter(): void {
    this.rawEpisodeFilter.set('');
    this.episodeFilterSubject.next('');
    this.store.dispatch(DetailActions.setEpisodeFilter({ term: '' }));
  }

  setSort(field: 'episode' | 'name' | 'air_date'): void {
    this.store.dispatch(DetailActions.setEpisodeSort({ field }));
  }

  getSortIcon(field: 'episode' | 'name' | 'air_date'): string {
    if (this.sortBy() !== field) return '↕';
    return this.sortAsc() ? '▲' : '▼';
  }

  getStatusBadgeClasses(status: string): string {
    switch (status?.toLowerCase()) {
      case 'alive':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'dead':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
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
}
