import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { selectAccessDeniedNotice } from '../../../core/store/role/role.selectors';
import * as RoleActions from '../../../core/store/role/role.actions';

@Component({
  selector: 'app-access-denied-banner',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    @if (notice(); as alertNotice) {
      <aside aria-label="Access Denied Alert" class="relative z-40 bg-gradient-to-r from-rose-950/90 via-red-900/80 to-amber-950/90 border-b border-rose-500/40 text-slate-100 shadow-xl shadow-rose-950/50 backdrop-blur-md animate-in slide-in-from-top duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            
            <div class="flex items-start sm:items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0">
                <mat-icon class="text-rose-400 text-lg !w-5 !h-5 flex items-center justify-center">gpp_bad</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-bold text-rose-200 tracking-wide flex items-center gap-2">
                  <span>{{ alertNotice.title }}</span>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/70 border border-rose-400/20 text-rose-300">403 FORBIDDEN</span>
                </h3>
                <p class="text-xs text-rose-200/90 mt-0.5 max-w-3xl leading-relaxed">
                  {{ alertNotice.message }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2.5 self-end sm:self-center shrink-0">
              <button
                type="button"
                mat-flat-button
                (click)="switchRoleAndNavigate(alertNotice.targetRoute)"
                class="!bg-emerald-500 !text-slate-950 !font-bold !text-xs !rounded-lg !shadow-md shadow-emerald-500/20">
                <mat-icon class="!w-4 !h-4 text-xs inline-flex items-center justify-center mr-1">admin_panel_settings</mat-icon>
                Switch to Admin Role
              </button>

              <button
                type="button"
                mat-icon-button
                (click)="dismissNotice()"
                class="!text-rose-300 hover:!text-white"
                title="Dismiss Alert">
                <mat-icon class="!w-5 !h-5">close</mat-icon>
              </button>
            </div>

          </div>
        </div>
      </aside>
    }
  `
})
export class AccessDeniedBannerComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  readonly notice = this.store.selectSignal(selectAccessDeniedNotice);

  switchRoleAndNavigate(targetRoute?: string): void {
    this.store.dispatch(RoleActions.setRole({ role: 'ADMIN' }));
    this.store.dispatch(RoleActions.clearAccessDenied());
    if (targetRoute && targetRoute !== '/character/:id') {
      this.router.navigateByUrl(targetRoute);
    }
  }

  dismissNotice(): void {
    this.store.dispatch(RoleActions.clearAccessDenied());
  }
}
