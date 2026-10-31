import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { of } from 'rxjs';
import { CharacterListComponent } from './character-list.component';
import { RickAndMortyService } from '../../core/services/rick-and-morty.service';
import { RoleService } from '../../core/services/role.service';
import { Character, CharacterApiResponse } from '../../core/models/character.model';
import { charactersReducer } from '../../core/store/characters/characters.reducer';
import { roleReducer } from '../../core/store/role/role.reducer';
import { CharactersEffects } from '../../core/store/characters/characters.effects';

describe('CharacterListComponent', () => {
  let component: CharacterListComponent;
  let fixture: ComponentFixture<CharacterListComponent>;
  let apiServiceSpy: jasmine.SpyObj<RickAndMortyService>;
  let roleService: RoleService;
  let router: Router;

  const mockCharacters: Character[] = [
    {
      id: 1,
      name: 'Rick Sanchez',
      status: 'Alive',
      species: 'Human',
      type: '',
      gender: 'Male',
      origin: { name: 'Earth (C-137)', url: '' },
      location: { name: 'Citadel', url: '' },
      image: 'rick.jpg',
      episode: ['ep1', 'ep2'],
      url: '',
      created: ''
    },
    {
      id: 2,
      name: 'Morty Smith',
      status: 'Alive',
      species: 'Human',
      type: '',
      gender: 'Male',
      origin: { name: 'Earth (C-137)', url: '' },
      location: { name: 'Earth', url: '' },
      image: 'morty.jpg',
      episode: ['ep1'],
      url: '',
      created: ''
    }
  ];

  const mockResponse: CharacterApiResponse = {
    info: { count: 2, pages: 1, next: null, prev: null },
    results: mockCharacters
  };

  beforeEach(async () => {
    localStorage.clear();
    apiServiceSpy = jasmine.createSpyObj('RickAndMortyService', ['getCharacters']);
    apiServiceSpy.getCharacters.and.returnValue(of(mockResponse));

    await TestBed.configureTestingModule({
      imports: [CharacterListComponent],
      providers: [
        provideRouter([]),
        provideStore({
          characters: charactersReducer,
          role: roleReducer
        }),
        provideEffects([CharactersEffects]),
        { provide: RickAndMortyService, useValue: apiServiceSpy },
        RoleService
      ]
    }).compileComponents();

    roleService = TestBed.inject(RoleService);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(CharacterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create and load characters on init', () => {
    expect(component).toBeTruthy();
    expect(apiServiceSpy.getCharacters).toHaveBeenCalled();
    expect(component.characters().length).toBe(2);
    expect(component.totalCharacters()).toBe(2);
  });

  it('should debounce character name search', fakeAsync(() => {
    apiServiceSpy.getCharacters.calls.reset();

    component.onSearchInput('R');
    component.onSearchInput('Ri');
    component.onSearchInput('Rick');

    expect(apiServiceSpy.getCharacters).not.toHaveBeenCalled();

    tick(360);
    expect(apiServiceSpy.getCharacters).toHaveBeenCalledTimes(1);
    expect(apiServiceSpy.getCharacters).toHaveBeenCalledWith(1, 'Rick');

    component.onSearchInput('Rick');
    tick(360);
    expect(apiServiceSpy.getCharacters).toHaveBeenCalledTimes(1);
  }));

  it('should switch between grid and list view', () => {
    expect(component.viewMode()).toBe('grid');
    component.setViewMode('list');
    expect(component.viewMode()).toBe('list');
    component.setViewMode('grid');
    expect(component.viewMode()).toBe('grid');
  });

  it('should navigate to character detail when ADMIN selects a character', () => {
    roleService.setRole('ADMIN');
    fixture.detectChanges();
    component.onSelectCharacter(mockCharacters[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/character', 1]);
  });

  it('should redirect to /access-denied when VIEWER selects a character', () => {
    roleService.setRole('VIEWER');
    fixture.detectChanges();
    component.onSelectCharacter(mockCharacters[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/access-denied'], {
      queryParams: { attempted: '/character/1' }
    });
  });

  it('should clear search and trigger character reload', fakeAsync(() => {
    component.onSearchInput('Rick');
    tick(360);
    apiServiceSpy.getCharacters.calls.reset();
    component.clearSearch();
    tick(360);
    expect(component.searchQuery()).toBe('');
    expect(apiServiceSpy.getCharacters).toHaveBeenCalledWith(1, '');
  }));
});
