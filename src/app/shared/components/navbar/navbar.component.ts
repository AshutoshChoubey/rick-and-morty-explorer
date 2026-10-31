import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { UserRole } from '../../../core/models/role.model';
import * as RoleActions from '../../../core/store/role/role.actions';
import { selectIsAdmin, selectIsViewer, selectCurrentRole } from '../../../core/store/role/role.selectors';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-[#080c14]/90 border-b border-slate-800 shadow-lg shadow-black/20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 sm:h-20">
          
          <a routerLink="/" class="flex items-center gap-3 group focus:outline-none rounded-lg p-1">
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-[2px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
              <div class="w-full h-full bg-[#0b1120] rounded-[10px] flex items-center justify-center overflow-hidden">
                <mat-icon class="text-emerald-400 text-xl !w-6 !h-6 flex items-center justify-center transform group-hover:rotate-45 transition-transform duration-500">science</mat-icon>
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Rick & Morty
                </span>
              </div>
              <p class="text-xs text-slate-400 font-medium hidden sm:block">Character Explorer</p>
            </div>
          </a>

          <div class="flex items-center gap-3 sm:gap-5">
            <a 
              routerLink="/" 
              routerLinkActive="text-emerald-400 bg-emerald-500/10 border-emerald-500/30" 
              [routerLinkActiveOptions]="{ exact: true }"
              class="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent transition-all">
              <mat-icon class="text-sm !w-4 !h-4 flex items-center justify-center">view_module</mat-icon>
              <span>Characters</span>
            </a>

            <a 
              href="https://github.com/AshutoshChoubey/rick-and-morty-explorer" 
              target="_blank" 
              rel="noopener noreferrer"
              class="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800/60 rounded-lg transition-all"
              title="GitHub Repository (opens in new tab)">
              <mat-icon class="text-sm !w-4 !h-4 flex items-center justify-center">code</mat-icon>
              <span>GitHub</span>
            </a>

            <div class="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
              <div class="flex items-center px-2 py-1 text-xs text-slate-400 font-medium border-r border-slate-800 mr-1 hidden sm:flex">
                <span class="text-[10px] font-mono tracking-wider uppercase text-slate-400">Role:</span>
              </div>

              <button
                type="button"
                (click)="setRole('ADMIN')"
                class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs transition-all duration-200"
                [ngClass]="isAdmin() ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200'">
                <mat-icon class="text-xs !w-3.5 !h-3.5 flex items-center justify-center">admin_panel_settings</mat-icon>
                <span class="tracking-wide">Admin</span>
              </button>

              <button
                type="button"
                (click)="setRole('VIEWER')"
                class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs transition-all duration-200"
                [ngClass]="isViewer() ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'">
                <mat-icon class="text-xs !w-3.5 !h-3.5 flex items-center justify-center">visibility</mat-icon>
                <span class="tracking-wide">Viewer</span>
              </button>
            </div>

            <div 
              class="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              [ngClass]="isAdmin() ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'">
              <span class="w-1.5 h-1.5 rounded-full" [ngClass]="isAdmin() ? 'bg-emerald-400' : 'bg-amber-400'"></span>
              <span>{{ isAdmin() ? 'Full Route Access' : 'List Only' }}</span>
            </div>

          </div>

        </div>
      </div>
    </header>
  `
})
export class NavbarComponent {
  private readonly store = inject(Store);

  readonly isAdmin = this.store.selectSignal(selectIsAdmin);
  readonly isViewer = this.store.selectSignal(selectIsViewer);
  readonly currentRole = this.store.selectSignal(selectCurrentRole);

  setRole(role: UserRole): void {
    this.store.dispatch(RoleActions.setRole({ role }));
  }
}
