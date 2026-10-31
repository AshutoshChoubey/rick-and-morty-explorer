import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { Character, CharacterApiResponse } from '../models/character.model';
import { Episode } from '../models/episode.model';

@Injectable({
  providedIn: 'root'
})
export class RickAndMortyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://rickandmortyapi.com/api';

  getCharacters(page: number = 1, name?: string): Observable<CharacterApiResponse> {
    let params = new HttpParams().set('page', page.toString());
    const trimmed = (name || '').trim();
    if (trimmed) {
      params = params.set('name', trimmed);
    }

    return this.http.get<CharacterApiResponse>(`${this.baseUrl}/character`, { params }).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of({
            info: { count: 0, pages: 0, next: null, prev: null },
            results: []
          });
        }
        throw error;
      })
    );
  }

  getCharacterById(id: number | string): Observable<Character> {
    return this.http.get<Character>(`${this.baseUrl}/character/${id}`);
  }

  getEpisodeById(id: number | string): Observable<Episode> {
    return this.http.get<Episode>(`${this.baseUrl}/episode/${id}`);
  }

  getEpisodesByIds(ids: (number | string)[]): Observable<Episode[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    if (ids.length === 1) {
      return this.http.get<Episode>(`${this.baseUrl}/episode/${ids[0]}`).pipe(
        map((ep) => [ep]),
        catchError(() => of([]))
      );
    }

    const idsParam = ids.join(',');
    return this.http.get<Episode[]>(`${this.baseUrl}/episode/${idsParam}`).pipe(
      map((res) => (Array.isArray(res) ? res : [res])),
      catchError(() => of([]))
    );
  }

  extractEpisodeIds(episodeUrls: string[]): number[] {
    if (!episodeUrls || episodeUrls.length === 0) return [];
    return episodeUrls
      .map((url) => {
        const segments = url.split('/').filter(Boolean);
        const last = segments[segments.length - 1];
        const parsed = parseInt(last, 10);
        return isNaN(parsed) ? null : parsed;
      })
      .filter((id): id is number => id !== null);
  }

  getCharacterEpisodes(character: Character): Observable<Episode[]> {
    const ids = this.extractEpisodeIds(character.episode);
    return this.getEpisodesByIds(ids);
  }
}
