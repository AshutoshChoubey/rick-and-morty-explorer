import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { of } from 'rxjs';
import { CharacterDetailComponent } from './character-detail.component';
import { RickAndMortyService } from '../../core/services/rick-and-morty.service';
import { Character } from '../../core/models/character.model';
import { Episode } from '../../core/models/episode.model';
import { characterDetailReducer } from '../../core/store/character-detail/character-detail.reducer';
import { charactersReducer } from '../../core/store/characters/characters.reducer';
import { CharacterDetailEffects } from '../../core/store/character-detail/character-detail.effects';

describe('CharacterDetailComponent', () => {
  let component: CharacterDetailComponent;
  let fixture: ComponentFixture<CharacterDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<RickAndMortyService>;

  const mockCharacter: Character = {
    id: 1,
    name: 'Rick Sanchez',
    status: 'Alive',
    species: 'Human',
    type: '',
    gender: 'Male',
    origin: { name: 'Earth (C-137)', url: '' },
    location: { name: 'Citadel', url: '' },
    image: 'rick.jpg',
    episode: ['https://rickandmortyapi.com/api/episode/1', 'https://rickandmortyapi.com/api/episode/2'],
    url: '',
    created: '2017-11-04T18:48:46.250Z'
  };

  const mockEpisodes: Episode[] = [
    {
      id: 1,
      name: 'Pilot',
      air_date: 'December 2, 2013',
      episode: 'S01E01',
      characters: [],
      url: '',
      created: ''
    },
    {
      id: 2,
      name: 'Lawnmower Dog',
      air_date: 'December 9, 2013',
      episode: 'S01E02',
      characters: [],
      url: '',
      created: ''
    }
  ];

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('RickAndMortyService', [
      'getCharacterById',
      'getCharacterEpisodes'
    ]);
    apiServiceSpy.getCharacterById.and.returnValue(of(mockCharacter));
    apiServiceSpy.getCharacterEpisodes.and.returnValue(of(mockEpisodes));

    await TestBed.configureTestingModule({
      imports: [CharacterDetailComponent],
      providers: [
        provideRouter([]),
        provideStore({
          characterDetail: characterDetailReducer,
          characters: charactersReducer
        }),
        provideEffects([CharacterDetailEffects]),
        { provide: RickAndMortyService, useValue: apiServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: '1' })),
            snapshot: {
              paramMap: convertToParamMap({ id: '1' })
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load character details and episodes on init', () => {
    expect(component).toBeTruthy();
    expect(apiServiceSpy.getCharacterById).toHaveBeenCalledWith('1');
    expect(apiServiceSpy.getCharacterEpisodes).toHaveBeenCalledWith(mockCharacter);
    expect(component.character()?.name).toBe('Rick Sanchez');
    expect(component.episodes().length).toBe(2);
    expect(component.filteredEpisodes().length).toBe(2);
  });

  it('should filter episodes by free-form name search', fakeAsync(() => {
    component.onEpisodeFilterInput('Lawnmower');
    expect(component.episodeSearchFilter()).toBe('');

    tick(260);
    expect(component.episodeSearchFilter()).toBe('Lawnmower');
    expect(component.filteredEpisodes().length).toBe(1);
    expect(component.filteredEpisodes()[0].name).toBe('Lawnmower Dog');

    component.onEpisodeFilterInput('Lawnmower');
    tick(260);
    expect(component.filteredEpisodes().length).toBe(1);

    component.onEpisodeFilterInput('pilot');
    tick(260);
    expect(component.filteredEpisodes().length).toBe(1);
    expect(component.filteredEpisodes()[0].name).toBe('Pilot');

    component.onEpisodeFilterInput('Nonexistent');
    tick(260);
    expect(component.filteredEpisodes().length).toBe(0);

    component.clearEpisodeFilter();
    tick(260);
    expect(component.filteredEpisodes().length).toBe(2);
  }));

  it('should sort episodes when header column is toggled', () => {
    component.setSort('name');
    expect(component.sortBy()).toBe('name');
    const sortedNames = component.filteredEpisodes().map((e) => e.name);
    expect(sortedNames).toEqual(['Lawnmower Dog', 'Pilot']);
  });

  it('should unsubscribe all subscriptions and clear character details on destroy', () => {
    expect(component['episodeFilterSub']?.closed).toBeFalse();
    component.ngOnDestroy();
    expect(component['episodeFilterSub']?.closed).toBeTrue();
    expect(component['routeParamSub']?.closed).toBeTrue();
  });
});
