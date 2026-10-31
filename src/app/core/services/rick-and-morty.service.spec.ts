import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RickAndMortyService } from './rick-and-morty.service';
import { Character, CharacterApiResponse } from '../models/character.model';
import { Episode } from '../models/episode.model';

describe('RickAndMortyService', () => {
  let service: RickAndMortyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RickAndMortyService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(RickAndMortyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch characters with pagination', () => {
    const mockResponse: CharacterApiResponse = {
      info: { count: 826, pages: 42, next: 'url', prev: null },
      results: [
        {
          id: 1,
          name: 'Rick Sanchez',
          status: 'Alive',
          species: 'Human',
          type: '',
          gender: 'Male',
          origin: { name: 'Earth', url: '' },
          location: { name: 'Earth', url: '' },
          image: 'rick.jpg',
          episode: ['https://rickandmortyapi.com/api/episode/1'],
          url: '',
          created: ''
        }
      ]
    };

    service.getCharacters(1).subscribe((data) => {
      expect(data.results.length).toBe(1);
      expect(data.results[0].name).toBe('Rick Sanchez');
    });

    const req = httpMock.expectOne('https://rickandmortyapi.com/api/character?page=1');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should include name search query param when provided', () => {
    service.getCharacters(1, 'Morty').subscribe();

    const req = httpMock.expectOne('https://rickandmortyapi.com/api/character?page=1&name=Morty');
    expect(req.request.method).toBe('GET');
    req.flush({ info: { count: 1, pages: 1, next: null, prev: null }, results: [] });
  });

  it('should handle 404 search gracefully returning empty results', () => {
    service.getCharacters(1, 'UnknownAlienxyz').subscribe((data) => {
      expect(data.results.length).toBe(0);
      expect(data.info.count).toBe(0);
    });

    const req = httpMock.expectOne('https://rickandmortyapi.com/api/character?page=1&name=UnknownAlienxyz');
    req.flush({ error: 'There is nothing here' }, { status: 404, statusText: 'Not Found' });
  });

  it('should extract episode IDs correctly from URLs', () => {
    const urls = [
      'https://rickandmortyapi.com/api/episode/1',
      'https://rickandmortyapi.com/api/episode/28',
      'invalid-url'
    ];
    const ids = service.extractEpisodeIds(urls);
    expect(ids).toEqual([1, 28]);
  });

  it('should fetch single episode when only 1 id passed', () => {
    const mockEpisode: Episode = {
      id: 1,
      name: 'Pilot',
      air_date: 'December 2, 2013',
      episode: 'S01E01',
      characters: [],
      url: '',
      created: ''
    };

    service.getEpisodesByIds([1]).subscribe((episodes) => {
      expect(episodes.length).toBe(1);
      expect(episodes[0].name).toBe('Pilot');
    });

    const req = httpMock.expectOne('https://rickandmortyapi.com/api/episode/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockEpisode);
  });

  it('should fetch multiple episodes comma separated', () => {
    const mockEpisodes: Episode[] = [
      { id: 1, name: 'Pilot', air_date: 'Dec 2, 2013', episode: 'S01E01', characters: [], url: '', created: '' },
      { id: 2, name: 'Lawnmower Dog', air_date: 'Dec 9, 2013', episode: 'S01E02', characters: [], url: '', created: '' }
    ];

    service.getEpisodesByIds([1, 2]).subscribe((episodes) => {
      expect(episodes.length).toBe(2);
      expect(episodes[1].name).toBe('Lawnmower Dog');
    });

    const req = httpMock.expectOne('https://rickandmortyapi.com/api/episode/1,2');
    expect(req.request.method).toBe('GET');
    req.flush(mockEpisodes);
  });
});

