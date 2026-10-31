import { Injectable, signal } from '@angular/core';
import { ViewMode } from '../models/character.model';

@Injectable({
  providedIn: 'root'
})
export class CharacterStateService {
  readonly searchQuery = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly viewMode = signal<ViewMode>('grid');
  readonly selectedCharacterId = signal<number | null>(null);

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setPage(page: number): void {
    this.currentPage.set(page);
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  setSelectedCharacterId(id: number | null): void {
    this.selectedCharacterId.set(id);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }
}

